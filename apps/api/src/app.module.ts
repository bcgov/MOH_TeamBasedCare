import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AppLogger } from './common/logger.service';
import { LoggerMiddleware } from './logger.middleware';
import { UnitModule } from './unit/unit.module';
import { SeedService } from './database/scripts/seed-service';
import { PlanningSessionModule } from './planning-session/planning-session.module';
import { CareActivityModule } from './care-activity/care-activity.module';
import { OccupationModule } from './occupation/occupation.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { KeycloakConfigService } from './config/keycloak-config.service';

@Module({
  imports: [
    DatabaseModule,
    UnitModule,
    PlanningSessionModule,
    CareActivityModule,
    OccupationModule,
    AuthModule,
    ConfigModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [ConfigModule],
    }),
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppLogger,
    AppService,
    SeedService,
    // { provide: APP_GUARD, useClass: AuthGuard }, [TODO - To be enabled]
    // { provide: APP_GUARD, useClass: RoleGuard }, [TODO - To be enabled]
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
