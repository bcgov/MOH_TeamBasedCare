import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_SKIP_AUTH, META_UNPROTECTED } from 'nest-keycloak-connect';
import { TokenExpiredError } from 'jsonwebtoken';
import { KeycloakUser, Role, hasAccess } from '@tbcm/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from './jwt.service';
import { AuthService } from './auth.service';
import { RequestContextService } from 'src/common/request-context.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly requestUserService: RequestContextService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // check if the endpoint is set unprotected and auth be skipped
    const isUnprotected = this.reflector.getAllAndOverride(META_UNPROTECTED, [
      context.getClass(),
      context.getHandler(),
    ]);

    const skipAuth = this.reflector.getAllAndOverride(META_SKIP_AUTH, [
      context.getClass(),
      context.getHandler(),
    ]);

    // If unprotected is set skip Keycloak authentication
    if (isUnprotected && skipAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const token: string | undefined = this.jwtService.extractToken(request.headers || '');
    if (!token) {
      return false;
    }

    let tokenUser: KeycloakUser;

    try {
      // decode from the token
      tokenUser = await this.jwtService.getUserFromToken(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        // trigger frontend to refresh token
        throw new UnauthorizedException('Authentication token expired');
      }
      // else fetch from the server
      tokenUser = await this.authService.getUserInfo(token);
    }

    if (!tokenUser) {
      return false;
    }

    // create / update / get user
    const user = await this.userService.resolveUser(tokenUser);

    // add user to the request
    request.user = user;

    // update request context service
    this.requestUserService.setUser(user);

    // if user access is revoked
    // exception to allow auth/user api to go through so user can get into the app to view the appropriate messaging
    if (user.revokedAt && !request.url.includes('/auth/user')) return false;

    // if both class and handler specify roles, handler's roles take affect than class's
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Permissive if @AllowRoles not provided at controller level
    if (!roles) {
      return true;
    }

    // validate if user has access to endpoint
    return hasAccess(user.roles, roles);
  }
}
