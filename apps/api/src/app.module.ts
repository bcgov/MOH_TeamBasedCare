import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AppLogger } from './common/logger.service';
import { LoggerMiddleware } from './logger.middleware';
import { UnitModule } from './unit/unit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bundle } from './entities/bundle.entity';
import { SeedService } from './database/scripts/seed-service';
import { CareActivity } from './entities/care-activity.entity';
import { Occupation } from './entities/occupation.entity';
import { AllowedActivity } from './entities/allowed-activities.entity';
import { Unit } from './unit/entity/unit.entity';
import { PlanningSession } from './planning-session/entity/planning-session.entity';
import { PlanningSessionModule } from './planning-session/planning-session.module';

@Module({
  imports: [
    DatabaseModule,
    UnitModule,
    PlanningSessionModule,
    TypeOrmModule.forFeature([
      Bundle,
      CareActivity,
      Occupation,
      AllowedActivity,
      Unit,
      PlanningSession,
    ]),
  ],
  controllers: [AppController],
  providers: [Logger, AppLogger, AppService, SeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
