import { Injectable } from '@nestjs/common';
import {
  KeycloakConnectOptions,
  KeycloakConnectOptionsFactory,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';

import 'dotenv/config';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
  createKeycloakConnectOptions(): KeycloakConnectOptions {
    return {
      authServerUrl: process.env.KEYCLOAK_AUTH_SERVER_URI,
      realm: process.env.KEYCLOAK_REALM,
      secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      resource: process.env.KEYCLOAK_CLIENT_ID,
      credentials: { secret: process.env.KEYCLOAK_CLIENT_SECRET || '' },

      'ssl-required': process.env.KEYCLOAK_SSL_REQUIRED,
      'confidential-port': process.env.KEYCLOAK_CONFIDENTIAL_PORT,

      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
      tokenValidation: TokenValidation.OFFLINE,
    };
  }
}
