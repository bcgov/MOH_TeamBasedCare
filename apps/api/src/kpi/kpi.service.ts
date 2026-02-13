import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { Unit } from 'src/unit/entity/unit.entity';
import { GeneralKPIsRO, CarePlansBySettingRO, KPIsOverviewRO, KPIFilterDTO } from '@tbcm/common';

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

  async getGeneralKPIs(healthAuthority?: string): Promise<GeneralKPIsRO> {
    // Total Users (non-revoked)
    const totalUsersQuery = this.userRepo
      .createQueryBuilder('u')
      .where('u.revokedAt IS NULL');

    if (healthAuthority) {
      totalUsersQuery.andWhere('u.organization = :healthAuthority', { healthAuthority });
    }

    const totalUsers = await totalUsersQuery.getCount();

    // Active Users (logged in during current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const activeUsersQuery = this.userRepo
      .createQueryBuilder('u')
      .where('u.lastLoginAt >= :startOfMonth', { startOfMonth })
      .andWhere('u.revokedAt IS NULL');

    if (healthAuthority) {
      activeUsersQuery.andWhere('u.organization = :healthAuthority', { healthAuthority });
    }

    const activeUsers = await activeUsersQuery.getCount();

    // Total Care Plans (filter by createdBy user's organization)
    const carePlansQuery = this.planningSessionRepo.createQueryBuilder('ps');

    if (healthAuthority) {
      carePlansQuery
        .innerJoin('ps.createdBy', 'usr')
        .where('usr.organization = :healthAuthority', { healthAuthority });
    }

    const totalCarePlans = await carePlansQuery.getCount();

    return new GeneralKPIsRO({
      totalUsers,
      activeUsers,
      totalCarePlans,
    });
  }

  async getCarePlansBySetting(filter: KPIFilterDTO): Promise<CarePlansBySettingRO[]> {
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
      this.getGeneralKPIs(filter.healthAuthority),
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
