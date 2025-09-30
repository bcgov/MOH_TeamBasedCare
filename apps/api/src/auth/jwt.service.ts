import { HttpException, HttpStatus } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { KeycloakUser } from '@tbcm/common';

export class JwtService {
  jwksClient = jwksRsa({
    jwksUri: `${process.env.KEYCLOAK_AUTH_SERVER_URI}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  });

  extractToken = (headers: { [key: string]: string }): string | undefined => {
    const getHeader = (name: string) => {
      return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    }
    const authorization = getHeader('Authorization');
    if (authorization) {
      const auth = authorization.split(' ');
      const type = auth[0].toLowerCase();
      if (type !== 'bearer') {
        throw new HttpException('Bearer token not found', HttpStatus.BAD_REQUEST);
      }
      return auth[1];
    } else {
      const apiKey = getHeader('x-api-key');
      if (apiKey){
        return apiKey;
      }
    }
  };

  async getUserFromToken(token: string) {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header.kid;
    const jwks = await this.jwksClient.getSigningKey(kid);
    const signingKey = jwks.getPublicKey();
    const verified = jwt.verify(token || '', signingKey);

    if (typeof verified !== 'string' && verified.azp !== 'TBCM') {
      throw new HttpException('Authentication token does not match', HttpStatus.FORBIDDEN);
    }

    const { ...user } = decoded?.payload as KeycloakUser;

    return user as KeycloakUser;
  }
}
