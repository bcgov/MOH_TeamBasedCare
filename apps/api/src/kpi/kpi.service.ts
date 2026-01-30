import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { Unit } from 'src/unit/entity/unit.entity';
import {
  GeneralKPIsRO,
  CarePlansBySettingRO,
  KPIsOverviewRO,
  KPIFilterDTO,
} from '@tbcm/common';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PlanningSession)
    private readonly planningSessionRepo: Repository<PlanningSession>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
  ) {}

  async getGeneralKPIs(): Promise<GeneralKPIsRO> {
    // Total Users (non-revoked)
    const totalUsers = await this.userRepo.count({
      where: { revokedAt: IsNull() },
    });

    // Active Users (logged in during current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const activeUsers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.lastLoginAt >= :startOfMonth', { startOfMonth })
      .andWhere('u.revokedAt IS NULL')
      .getCount();

    // Total Care Plans
    const totalCarePlans = await this.planningSessionRepo.count();

    return new GeneralKPIsRO({
      totalUsers,
      activeUsers,
      totalCarePlans,
    });
  }

  async getCarePlansBySetting(
    filter: KPIFilterDTO,
  ): Promise<CarePlansBySettingRO[]> {
    const queryBuilder = this.planningSessionRepo
      .createQueryBuilder('ps')
      .innerJoin('ps.careLocation', 'u')
      .innerJoin('ps.createdBy', 'usr')
      .select('u.id', 'careSettingId')
      .addSelect('u.displayName', 'careSettingName')
      .addSelect('usr.organization', 'healthAuthority')
      .addSelect('COUNT(ps.id)', 'count')
      .groupBy('u.id')
      .addGroupBy('u.displayName')
      .addGroupBy('usr.organization')
      .orderBy('count', 'DESC');

    // Apply health authority filter
    if (filter.healthAuthority) {
      queryBuilder.andWhere('usr.organization = :healthAuthority', {
        healthAuthority: filter.healthAuthority,
      });
    }

    // Apply care setting filter
    if (filter.careSettingId) {
      queryBuilder.andWhere('u.id = :careSettingId', {
        careSettingId: filter.careSettingId,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map(
      r =>
        new CarePlansBySettingRO({
          careSettingId: r.careSettingId,
          careSettingName: r.careSettingName,
          healthAuthority: r.healthAuthority || 'Unknown',
          count: parseInt(r.count, 10),
        }),
    );
  }

  async getKPIsOverview(filter: KPIFilterDTO): Promise<KPIsOverviewRO> {
    const [general, carePlansBySetting] = await Promise.all([
      this.getGeneralKPIs(),
      this.getCarePlansBySetting(filter),
    ]);

    return new KPIsOverviewRO({
      general,
      carePlansBySetting,
    });
  }

  async getCareSettings(): Promise<{ id: string; displayName: string }[]> {
    const units = await this.unitRepo.find({
      select: ['id', 'displayName'],
      order: { displayName: 'ASC' },
    });

    return units.map(u => ({
      id: u.id,
      displayName: u.displayName,
    }));
  }
}
