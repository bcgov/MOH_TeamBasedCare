import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Occupation } from './entity/occupation.entity';
import { OccupationController } from './occupation.controller';
import { OccupationService } from './occupation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Occupation])],
  exports: [OccupationService],
  controllers: [OccupationController],
  providers: [OccupationService],
})
export class OccupationModule {}
