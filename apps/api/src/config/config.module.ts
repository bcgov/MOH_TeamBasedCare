import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { KeycloakConfigService } from './keycloak-config.service';

@Module({
  providers: [KeycloakConfigService, ConfigService],
  exports: [KeycloakConfigService, ConfigService],
})
export class ConfigModule {}
