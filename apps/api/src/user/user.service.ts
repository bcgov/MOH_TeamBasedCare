import { Injectable } from '@nestjs/common';
import { KeycloakUser } from '@tbcm/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async upsertUser(keycloakUser: KeycloakUser): Promise<User> {
    return this.userRepo.save({
      keycloakId: keycloakUser.sub,
      email: keycloakUser.email,
      username: keycloakUser.preferred_username,
      displayName: keycloakUser.name,
      // organization: keycloakUser.organization,
    });
  }

  async getUser(id: string) {
    return this.userRepo.findOne(id, { relations: [''] });
  }

  /** USER PREFERENCE FUNCTIONS */
  //   async updateUserPreferece()
}
