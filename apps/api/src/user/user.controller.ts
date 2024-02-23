import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { UserRO } from '@tbcm/common';
import { CreateUserInviteDto } from './dto/create-user-invite.dto';

@ApiTags('user')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/invite')
  async invite(@Body() data: CreateUserInviteDto): Promise<UserRO> {
    const user = await this.userService.createUserFromInvite(data);
    return new UserRO(user);
  }
}
