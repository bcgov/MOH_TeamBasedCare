import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entity/unit.entity';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';
import { UnitSubscriber } from './subscribers/unit.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Unit])],
  exports: [UnitService],
  controllers: [UnitController],
  providers: [UnitService, UnitSubscriber],
})
export class UnitModule {}
