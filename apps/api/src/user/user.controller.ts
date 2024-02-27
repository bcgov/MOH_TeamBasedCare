import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { UserRO } from '@tbcm/common';
import { CreateUserInviteDto } from './dto/create-user-invite.dto';
import { IRequest } from 'src/common/app-request';

@ApiTags('user')
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/invite')
  async invite(@Body() data: CreateUserInviteDto, @Req() req: IRequest): Promise<UserRO> {
    const tokenUser = req.user;
    const user = await this.userService.createUserFromInvite(data, tokenUser);
    return new UserRO(user);
  }
}
