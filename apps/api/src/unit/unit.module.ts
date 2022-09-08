import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from 'src/entities/unit.entity';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Unit])],
  exports: [],
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule {}
