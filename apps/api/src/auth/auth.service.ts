import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import * as queryString from 'querystring';
import { catchError, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/config/config.service';
import { KeycloakToken } from '@tbcm/common';
import { KeycloakUser } from '@tbcm/common';
import { AppLogger } from 'src/common/logger.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private keycloakAuthServerUri: string;

  private keycloakResponseType: string;

  private keycloakRealm: string;

  private keycloakRedirectUri: string;

  private keycloakClientId: string;

  private keycloakClientSecret: string;

  private keycloakTokenUri: string;

  private keycloakUserInfoUri: string;

  private keycloakLogoutUri: string;

  private readonly logger = new AppLogger();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.keycloakAuthServerUri = this.configService.getValue('KEYCLOAK_AUTH_SERVER_URI');
    this.keycloakResponseType = this.configService.getValue('KEYCLOAK_RESPONSE_TYPE');
    this.keycloakRealm = this.configService.getValue('KEYCLOAK_REALM');
    this.keycloakRedirectUri = this.configService.getValue('KEYCLOAK_REDIRECT_URI');
    this.keycloakClientId = this.configService.getValue('KEYCLOAK_CLIENT_ID');
    this.keycloakClientSecret = this.configService.getValue('KEYCLOAK_CLIENT_SECRET');
    this.keycloakUserInfoUri = this.configService.getValue('KEYCLOAK_USER_INFO_URI');
    this.keycloakTokenUri = this.configService.getValue('KEYCLOAK_TOKEN_URI');
    this.keycloakLogoutUri = this.configService.getValue('KEYCLOAK_LOGOUT_URI');
  }

  getUrlLogin(): any {
    return {
      url:
        `${this.keycloakAuthServerUri}` +
        `/realms/${this.keycloakRealm}/protocol/openid-connect/auth` +
        `?client_id=${this.keycloakClientId}` +
        `&response_type=${this.keycloakResponseType}` +
        `&redirect_uri=${this.keycloakRedirectUri}` +
        `&scope=openid`,
    };
  }

  async getAccessToken(code: string): Promise<KeycloakToken> {
    const params = {
      grant_type: 'authorization_code',
      client_id: this.keycloakClientId,
      client_secret: this.keycloakClientSecret,
      code: code,
      redirect_uri: this.keycloakRedirectUri,
    };

    const data = await firstValueFrom(
      this.httpService
        .post(this.keycloakTokenUri, queryString.stringify(params), this.getContentType())
        .pipe(
          map(
            (res: any) =>
              new KeycloakToken(
                res.data.access_token,
                res.data.refresh_token,
                res.data.expires_in,
                res.data.refresh_expires_in,
              ),
          ),
          catchError(e => {
            this.logger.error('auth.service.ts :: getAccessToken');
            this.logger.error(JSON.stringify(params));
            this.logger.error(e);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );
    return data;
  }

  async getUserInfo(accessToken: string) {
    const params = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let keycloakUser: KeycloakUser;

    try {
      // decode jwt from the access token
      keycloakUser = jwt.decode(accessToken) as KeycloakUser;
    } catch (e) {
      // if decoding fails, fetch from the server
      keycloakUser = await firstValueFrom(
        this.httpService.get(this.keycloakUserInfoUri, params).pipe(
          map(async (res: any) => res.data),
          catchError(e => {
            this.logger.error('auth.service.ts :: getUserInfo');
            this.logger.error(JSON.stringify(params));
            this.logger.error(e);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
      );
    }

    if (!keycloakUser) {
      this.logger.error('auth.service.ts :: getUserInfo');
      this.logger.error('Keycloak user not found');
      throw new NotFoundException();
    }

    // if email does not exists, throw error
    if (!keycloakUser.email) {
      this.logger.error('auth.service.ts :: getUserInfo');
      this.logger.error('Keycloak email not found');
      throw new NotFoundException();
    }

    // find existing user
    let user = await this.userService.findByEmail(keycloakUser.email);

    // if user does not exist, create new user with empty roles
    if (!user) {
      this.logger.log(
        `auth.service.ts :: getUserInfo :: Creating new user from auth :: ${keycloakUser.email}`,
      );
      user = await this.userService.createUserFromAuth(keycloakUser);
    }

    // Invited user signing in for the first time?
    if (!user.keycloakId) {
      this.logger.log(
        `auth.service.ts :: getUserInfo :: Invited user fist time signing in :: ${keycloakUser.email}`,
      );
      user = await this.userService.updateUserFromAuth(user, keycloakUser);
    }

    // update lastAccessAt
    await this.userService.updateLastAccessAt(user);

    return user;
  }

  async refreshAccessToken(refresh_token: string): Promise<KeycloakToken> {
    const params = {
      grant_type: 'refresh_token',
      client_id: this.keycloakClientId,
      client_secret: this.keycloakClientSecret,
      refresh_token: refresh_token,
      redirect_uri: this.keycloakRedirectUri,
    };

    const data = await firstValueFrom(
      this.httpService
        .post(this.keycloakTokenUri, queryString.stringify(params), this.getContentType())
        .pipe(
          map(
            (res: any) =>
              new KeycloakToken(
                res.data.access_token,
                res.data.refresh_token,
                res.data.expires_in,
                res.data.refresh_expires_in,
              ),
          ),
          catchError(e => {
            this.logger.error('auth.service.ts :: refreshAccessToken');
            this.logger.error(JSON.stringify(params));
            this.logger.error(e);
            throw new HttpException(
              e?.response?.data || 'Error data unknown, Something Went wrong',
              e?.response?.status || 500,
            );
          }),
        ),
    );
    return data;
  }

  async logout(refresh_token: string) {
    const params = {
      client_id: this.keycloakClientId,
      client_secret: this.keycloakClientSecret,
      refresh_token: refresh_token,
    };

    const data = await firstValueFrom(
      this.httpService
        .post(this.keycloakLogoutUri, queryString.stringify(params), this.getContentType())
        .pipe(
          map((res: any) => res.data),
          catchError(e => {
            this.logger.error('auth.service.ts :: logout');
            this.logger.error(JSON.stringify(params));
            this.logger.error(e);
            throw new HttpException(
              e?.response?.data || 'Error data unknown, Something Went wrong',
              e?.response?.status || 500,
            );
          }),
        ),
    );
    return data;
  }

  getContentType() {
    return { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
  }
}
