import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Authorities,
  Authority,
  CreateUserInviteDTO,
  EditUserDTO,
  KeycloakUser,
  SortOrder,
} from '@tbcm/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from 'src/common/logger.service';
import { FindUsersDto } from './dto/find-users.dto';

@Injectable()
export class UserService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(id: string) {
    return this.userRepo.findOne(id);
  }

  async findByEmail(email: string) {
    if (!email) return;

    return this.userRepo.findOne({ email });
  }

  async resolveUser(keycloakUser: KeycloakUser) {
    if (!keycloakUser?.email) {
      this.logger.error('user.service.ts :: resolveUser');
      this.logger.error('Cannot resolve user due to invalid email');
      this.logger.error(`keycloak email: ${keycloakUser.email}`);
      throw new BadRequestException({ message: 'Cannot resolve user due to invalid email' });
    }

    // find existing user
    let user = await this.findByEmail(keycloakUser.email);

    // if user does not exist, create new user with empty roles
    if (!user) {
      user = await this.createUserFromAuth(keycloakUser);
    }

    // if invited user signing in for the first time?
    if (!user.keycloakId) {
      user = await this.updateUserFromAuth(user, keycloakUser);
    }

    // Existing users migrated from planning sessions, feedback, care-activity search term entities at the time of migration - 1709228812566-migrate-existing-data.ts
    // would be missing the following information; When the user logs in next time, we intend to capture the missing information.
    if (!user.firstName || !user.familyName || !user.organization) {
      user = await this.updateMissingInfo(user, keycloakUser);
    }

    // validate auth
    if (user?.keycloakId !== keycloakUser.sub) {
      // In an ideal situation, this should never happen;
      // However, if it does, it could potentially be due to email ID invited by admin is linked to a different keycloak ID
      // Please verify the email and the user; Remove invite and try again.
      this.logger.error('user.service.ts :: resolveUser');
      this.logger.error('Cannot resolve user due to auth (keycloak ID) mismatch');
      this.logger.error(`saved email: ${user?.email}; keycloak email: ${keycloakUser.email}`);
      this.logger.error(`saved keycloakId: ${user?.keycloakId}; keycloak sub: ${keycloakUser.sub}`);

      throw new ConflictException({ message: 'Cannot resolve user due to auth mismatch' });
    }

    // add organization
    if (!user.organization) {
      const authority = this._getOrganization(user.email);

      if (authority) {
        user.organization = authority.name;
        await this.userRepo.save(user);
      }
    }

    // return user
    return user;
  }

  _getOrganization(email?: string): Authority | undefined {
    if (!email) {
      return undefined;
    }
    // get domain from email string
    const domain = email.substring(email.lastIndexOf('@') + 1);

    //return organization or undefined
    return Object.values(Authorities).find(a => a.domains.includes(domain));
  }

  async createUserFromAuth(keycloakUser: KeycloakUser) {
    // if email does not exists, throw error
    if (!keycloakUser.email) {
      throw new BadRequestException();
    }

    // create user without ROLE
    return this.userRepo.save({
      email: keycloakUser.email,
      keycloakId: keycloakUser.sub,
      firstName: keycloakUser.given_name,
      familyName: keycloakUser.family_name,
      displayName: keycloakUser.name,
      organization: keycloakUser.organization,
      username: keycloakUser.preferred_username,
    });
  }

  async createUserFromInvite(createUserInvite: CreateUserInviteDTO, tokenUser: User) {
    // if email does not exists, throw error
    if (!createUserInvite.email) {
      throw new BadRequestException();
    }

    // create user without ROLE
    return this.userRepo.save({
      email: createUserInvite.email,
      roles: createUserInvite.roles,
      invitedBy: tokenUser,
      invitedAt: new Date(),
    });
  }

  async updateUserFromAuth(user: User, keycloakUser: KeycloakUser) {
    // if email or user does not exists, throw error
    if (!keycloakUser.email || !user) {
      throw new BadRequestException();
    }

    // update user
    user.keycloakId = keycloakUser.sub;
    user.firstName = keycloakUser.given_name;
    user.familyName = keycloakUser.family_name;
    user.displayName = keycloakUser.name;
    user.organization = keycloakUser.organization;
    user.username = keycloakUser.preferred_username;

    return this.userRepo.save(user);
  }

  // update missing fields when uses with partial data is available
  async updateMissingInfo(user: User, keycloakUser: KeycloakUser) {
    // if email or user does not exists, throw error
    if (!keycloakUser.email || !user) {
      throw new BadRequestException();
    }

    // update user
    user.firstName = keycloakUser.given_name;
    user.familyName = keycloakUser.family_name;
    user.organization = keycloakUser.organization;

    return this.userRepo.save(user);
  }

  async updateLastAccessAt(user: User) {
    // if user does not exists, throw error
    if (!user) {
      throw new BadRequestException();
    }

    // throw forbidden if user email is not the logged in user email
    // TODO

    // update last access at
    user.lastAccessAt = new Date();

    // return updated user
    return this.userRepo.save(user);
  }

  async isRevoked(user: User) {
    if (!user.revokedAt) {
      return false;
    }

    return true;
  }

  async findUsers(query: FindUsersDto): Promise<[User[], number]> {
    const queryBuilder = this.userRepo.createQueryBuilder('u');

    // Search logic below
    if (query.searchText) {
      queryBuilder
        .where('u.email ILIKE :name', { name: `%${query.searchText}%` })
        .orWhere('u.organization ILIKE :name', { name: `%${query.searchText}%` });
    }

    if (query.sortBy) queryBuilder.orderBy(`u.${query.sortBy}`, query.sortOrder as SortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  async editUser(id: string, data: EditUserDTO, loggedInUser: User) {
    if (!id) {
      throw new BadRequestException('No user ID found');
    }

    if (id === loggedInUser.id) {
      throw new ForbiddenException('Cannot edit own user');
    }

    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepo.save({
      ...user,
      ...data,
    });
  }

  async revokeUser(id: string, loggedInUser: User) {
    if (!id) throw new BadRequestException('No user ID found');

    if (id === loggedInUser.id) throw new ForbiddenException('Cannot revoke own user access');

    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    user.revokedAt = new Date();
    return this.userRepo.save(user);
  }

  async reProvisionUser(id: string, loggedInUser: User) {
    if (!id) throw new BadRequestException('No user ID found');

    if (id === loggedInUser.id) throw new ForbiddenException('Cannot re-provision own user access');

    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    user.revokedAt = null;
    return this.userRepo.save(user);
  }
}
