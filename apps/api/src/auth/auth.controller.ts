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

    // TODO: fix later
    // explicitly added any to the return type to counter Runtime.ImportModuleError; PR #61,#62,#63
    // https://user-images.githubusercontent.com/87394256/272416729-ec2d029c-3b5d-492e-aba6-d3f793b5dd70.png
    const keycloakToken: any = await this.authService.getAccessToken(code);
    return keycloakToken;
  }

  @Get('user')
  @ApiResponse({ status: HttpStatus.OK, type: EmptyResponse })
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserInfo(@Req() req: any) {
    if (!req.headers.authorization.startsWith('Bearer')) return;
    const accessToken = req.headers.authorization.replace('Bearer ', '');
    const userInfo = await this.authService.getUserInfo(accessToken);

    return new UserRO(userInfo);
  }

  @Post('refresh')
  @ApiOkResponse({
    description: 'Refresh access token with keycloak sso server ',
  })
  @Unprotected()
  @ApiResponse({ status: HttpStatus.OK, type: EmptyResponse })
  async refreshAccessToken(@Body() token: AppTokensDTO) {
    try {
      // TODO: fix later
      // explicitly added any to the return type to counter Runtime.ImportModuleError; PR #61,#62,#63
      // https://user-images.githubusercontent.com/87394256/272416729-ec2d029c-3b5d-492e-aba6-d3f793b5dd70.png
      const refreshToken: any = await this.authService.refreshAccessToken(token.refresh_token);
      return refreshToken;
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
