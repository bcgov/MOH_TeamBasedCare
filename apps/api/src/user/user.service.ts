import { BadRequestException, Injectable } from '@nestjs/common';
import { KeycloakUser } from '@tbcm/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInviteDto } from './dto/create-user-invite.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(id: string) {
    return this.userRepo.findOne(id);
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ email });
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

  async createUserFromInvite(createUserInvite: CreateUserInviteDto) {
    // if email does not exists, throw error
    if (!createUserInvite.email) {
      throw new BadRequestException();
    }

    // create user without ROLE
    return this.userRepo.save({
      email: createUserInvite.email,
      roles: createUserInvite.roles,
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
}
