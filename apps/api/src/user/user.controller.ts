import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserInviteDTO, EditUserDTO, PaginationRO, Role, UserRO } from '@tbcm/common';
import { IRequest } from 'src/common/app-request';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { FindUsersDto } from './dto/find-users.dto';

@ApiTags('user')
@Controller('user')
@AllowRoles({ roles: [Role.ADMIN] })
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/invite')
  async invite(@Body() data: CreateUserInviteDTO, @Req() req: IRequest): Promise<UserRO> {
    const tokenUser = req.user;
    const user = await this.userService.createUserFromInvite(data, tokenUser);
    return new UserRO(user);
  }

  @Get('/find')
  async findUsers(@Query() query: FindUsersDto): Promise<PaginationRO<UserRO[]>> {
    const [users, total] = await this.userService.findUsers(query);
    return new PaginationRO([users.map(user => new UserRO(user)), total]);
  }

  @Post('/:id/edit')
  @HttpCode(HttpStatus.NO_CONTENT)
  async editUser(@Body() data: EditUserDTO, @Param('id') id: string, @Req() req: IRequest) {
    await this.userService.editUser(id, data, req.user);
  }

  @Post('/:id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeUser(@Param('id') id: string, @Req() req: IRequest) {
    await this.userService.revokeUser(id, req.user);
  }

  @Post('/:id/re-provision')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reProvisionUser(@Param('id') id: string, @Req() req: IRequest) {
    await this.userService.reProvisionUser(id, req.user);
  }
}
