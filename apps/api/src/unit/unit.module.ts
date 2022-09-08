import { Module } from '@nestjs/common';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';

@Module({
  imports: [],
  exports: [],
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule {}
