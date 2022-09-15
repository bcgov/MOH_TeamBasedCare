import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AppLogger } from './common/logger.service';
import { LoggerMiddleware } from './logger.middleware';
import { UnitModule } from './unit/unit.module';
import { SeedService } from './database/scripts/seed-service';
import { PlanningSessionModule } from './planning-session/planning-session.module';
import { CareActivityModule } from './care-activity/care-activity.module';

@Module({
  imports: [DatabaseModule, UnitModule, PlanningSessionModule, CareActivityModule],
  controllers: [AppController],
  providers: [Logger, AppLogger, AppService, SeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
