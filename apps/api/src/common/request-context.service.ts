import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RequestContextService {
  private user: User;

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }
}
