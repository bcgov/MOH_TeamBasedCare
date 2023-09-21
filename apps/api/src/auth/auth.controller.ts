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
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { AppTokensDTO } from '@tbcm/common';
import { KeycloakToken } from '@tbcm/common';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
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
  async getAccessToken(@Body('code') code: string) {
    if (!code) return;
    const keycloakToken: KeycloakToken = await this.authService.getAccessToken(code);
    return keycloakToken;
  }

  @Get('user')
  async getUserInfo(@Req() req: any) {
    if (!req.headers.authorization.startsWith('Bearer')) return;
    const accessToken = req.headers.authorization.replace('Bearer ', '');
    const kcUserInfo = await this.authService.getUserInfo(accessToken);
    return kcUserInfo;
  }

  @Post('refresh')
  @ApiOkResponse({
    description: 'Refresh access token with keycloak sso server ',
  })
  @Unprotected()
  refreshAccessToken(@Body() token: AppTokensDTO) {
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
