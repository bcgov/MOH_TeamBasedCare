import {
  Controller,
  Get,
  Redirect,
  HttpStatus,
  Post,
  Body,
  Req,
  HttpException,
  InternalServerErrorException,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { AppTokensDTO, UserRO } from '@tbcm/common';
import { EmptyResponse } from 'src/common/ro/empty-response.ro';
import { IRequest } from 'src/common/app-request';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Unprotected()
  @Redirect('', HttpStatus.MOVED_PERMANENTLY)
  @ApiOkResponse({
    description: 'redirect to keycloak sso server for user login',
  })
  login() {
    return this.authService.getUrlLogin();
  }

  @Post('callback')
  @Unprotected()
  @ApiOkResponse({ description: 'Get access token payload with credentials' })
  @ApiResponse({ status: HttpStatus.OK, type: EmptyResponse })
  async getAccessToken(@Body('code') code: string) {
    if (!code) return;

    return this.authService.getAccessToken(code);
  }

  @Get('user')
  @ApiResponse({ status: HttpStatus.OK })
  @UseInterceptors(ClassSerializerInterceptor)
  async getUser(@Req() req: IRequest) {
    return new UserRO(req.user);
  }

  @Post('refresh')
  @ApiOkResponse({
    description: 'Refresh access token with keycloak sso server ',
  })
  @Unprotected()
  @ApiResponse({ status: HttpStatus.OK })
  async refreshAccessToken(@Body() token: AppTokensDTO) {
    try {
      return this.authService.refreshAccessToken(token.refresh_token);
    } catch (e) {
      if (e instanceof HttpException) {
        throw new HttpException(' Token failed', e.getStatus());
      }
      throw new InternalServerErrorException('Refresh Token failed');
    }
  }

  @Post('logout')
  @Unprotected()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Logout from keycloak sso server' })
  async logout(@Body() token: AppTokensDTO) {
    try {
      await this.authService.logout(token.refresh_token);
    } catch (e) {
      if (e instanceof HttpException) {
        throw new HttpException('Logout failed', e.getStatus());
      }
      throw new InternalServerErrorException('Logout failed');
    }
    return;
  }
}
