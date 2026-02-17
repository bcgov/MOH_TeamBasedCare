import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { CareSettingTemplate } from 'src/unit/entity/care-setting-template.entity';
import {
  GeneralKPIsRO,
  CarePlansBySettingRO,
  KPIsOverviewRO,
  KPIFilterDTO,
  KPICareSettingRO,
  Role,
} from '@tbcm/common';

@Injectable()
export class KpiService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PlanningSession)
    private readonly planningSessionRepo: Repository<PlanningSession>,
    @InjectRepository(CareSettingTemplate)
    private readonly templateRepo: Repository<CareSettingTemplate>,
  ) {}

  /** Returns null for admins (no HA restriction), or the user's org for content admins. */
  getEffectiveHealthAuthority(user: { roles?: Role[]; organization?: string }): string | null {
    const isAdmin = user.roles?.some(r => r === Role.ADMIN);
    if (isAdmin) return null;
    return user.organization || '';
  }

  async getGeneralKPIs(healthAuthority?: string): Promise<GeneralKPIsRO> {
    // Total Users (non-revoked)
    const totalUsersQuery = this.userRepo.createQueryBuilder('u').where('u.revokedAt IS NULL');

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

    // Total Care Plans (always join template for consistency with per-template cards)
    const carePlansQuery = this.planningSessionRepo
      .createQueryBuilder('ps')
      .innerJoin('ps.careSettingTemplate', 'cst');

    if (healthAuthority) {
      carePlansQuery.where('cst.healthAuthority IN (:...authorities)', {
        authorities: [healthAuthority, 'GLOBAL'],
      });
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
      .innerJoin('ps.careSettingTemplate', 'cst')
      .innerJoin('cst.unit', 'u')
      .select('cst.id', 'careSettingId')
      .addSelect('u.displayName', 'careSettingName')
      .addSelect('cst.healthAuthority', 'healthAuthority')
      .addSelect('COUNT(ps.id)', 'count')
      .groupBy('cst.id')
      .addGroupBy('u.displayName')
      .addGroupBy('cst.healthAuthority')
      .orderBy('count', 'DESC');

    // Apply health authority filter (uses template's HA, not creator's org)
    if (filter.healthAuthority) {
      queryBuilder.andWhere('cst.healthAuthority IN (:...authorities)', {
        authorities: [filter.healthAuthority, 'GLOBAL'],
      });
    }

    // Apply care setting filter (now a template ID)
    if (filter.careSettingId) {
      queryBuilder.andWhere('cst.id = :careSettingId', {
        careSettingId: filter.careSettingId,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map(
      r =>
        new CarePlansBySettingRO({
          careSettingId: r.careSettingId,
          careSettingName: r.careSettingName,
          healthAuthority:
            r.healthAuthority === 'GLOBAL' ? 'Master' : r.healthAuthority || 'Unknown',
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

  async getCareSettings(healthAuthority?: string | null): Promise<KPICareSettingRO[]> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('cst')
      .innerJoin('cst.unit', 'u')
      .select('cst.id', 'id')
      .addSelect('u.displayName', 'displayName')
      .addSelect('cst.healthAuthority', 'healthAuthority');

    // Content admins see their HA + GLOBAL templates; admins see all (healthAuthority = null)
    if (healthAuthority !== undefined && healthAuthority !== null) {
      if (healthAuthority) {
        queryBuilder.where('cst.healthAuthority IN (:...authorities)', {
          authorities: [healthAuthority, 'GLOBAL'],
        });
      } else {
        queryBuilder.where('cst.healthAuthority = :global', { global: 'GLOBAL' });
      }
    }

    queryBuilder.orderBy('u.displayName', 'ASC').addOrderBy('cst.healthAuthority', 'ASC');

    const results = await queryBuilder.getRawMany();
    return results.map(
      r =>
        new KPICareSettingRO({
          id: r.id,
          displayName: r.displayName,
          healthAuthority: r.healthAuthority,
        }),
    );
  }
}
