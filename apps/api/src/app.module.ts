import { Global, Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { APP_GUARD } from '@nestjs/core';
import { AllowedActivityModule } from './allowed-activity/allowed-activity.module';
import { FeedbackModule } from './feedback/feedback.module';
import { UserGuideModule } from './user-guide/user-guide.module';
import { UserModule } from './user/user.module';
import { AuthGuard } from './auth/auth.guard';
import { RequestContextService } from './common/request-context.service';

@Global()
@Module({
  imports: [
    DatabaseModule,
    UnitModule,
    PlanningSessionModule,
    CareActivityModule,
    OccupationModule,
    AllowedActivityModule,
    AuthModule,
    ConfigModule,
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      imports: [ConfigModule],
    }),
    FeedbackModule,
    UserGuideModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppLogger,
    AppService,
    SeedService,
    { provide: APP_GUARD, useClass: AuthGuard },
    RequestContextService,
  ],
  exports: [RequestContextService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
