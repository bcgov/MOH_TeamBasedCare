import assert from 'assert';
import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class AddUnitColumnToAllowedActivity1741307582814 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('allowed_activity');

    assert(!!table, 'allowed_activity table not found');

    const column = table.findColumnByName('unit');
    if (!column) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'unit_id',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }
    const occupation = table.findColumnByName('occupation_id');
    if (occupation) {
      const unique = table.findColumnUniques(occupation)?.[0];
      if (unique) {
        await queryRunner.dropUniqueConstraint(table, unique);
      }
    }

    // update allowed activities for ED
    await queryRunner.query(`
      update allowed_activity aa set unit_id = (
        select u.id from unit u where u.name = 'emergencydepartment' 
      )
      where aa.care_activity_id in (
        select cu.care_activity_id from care_activity_care_locations_unit cu
        inner join unit u on cu.unit_id  = u.id
        where u.name = 'emergencydepartment'
      )
    `);

    // update allowed activities for acutecaremedicine
    await queryRunner.query(`
      update allowed_activity aa set unit_id = (
        select u.id from unit u where u.name = 'acutecaremedicine' 
      )
      where aa.care_activity_id in (
        select cu.care_activity_id from care_activity_care_locations_unit cu
        inner join unit u on cu.unit_id  = u.id
        where u.name = 'acutecaremedicine'
      )
    `);

    // copy allowed activities for renamed activities
    const existing = await queryRunner.query(`
      select * from allowed_activity aa 
      where aa.care_activity_id in (
        select cu.care_activity_id from care_activity_care_locations_unit cu
        inner join unit u on cu.unit_id  = u.id
        where u.name = 'emergencydepartment'
      )
      and aa.created_by_id is null;
    `);

    const accuteCareUnit = await queryRunner.query(
      `select id from unit where name = 'acutecaremedicine'`,
    );
    const unit_id = accuteCareUnit[0].id;

    await Promise.all(
      existing.map(async (aa: Record<string, string>) => {
        await queryRunner.query(`
        insert into allowed_activity
          (permission, occupation_id, care_activity_id, unit_id)
        values
          ('${aa.permission}', '${aa.occupation_id}', '${aa.care_activity_id}', '${unit_id}')
      `);
      }),
    );

    await queryRunner.createUniqueConstraint(
      table,
      new TableUnique({
        name: 'unit_occupation_careActivity',
        columnNames: ['unit_id', 'occupation_id', 'care_activity_id'],
      }),
    );

    // unit_care_activities_care_activity is duplicate of care_activity_care_locations_unit
    const relationOfUnitAndCareActivity = await queryRunner.getTable(
      'unit_care_activities_care_activity',
    );
    if (relationOfUnitAndCareActivity) {
      await queryRunner.dropTable(relationOfUnitAndCareActivity);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('allowed_activity');

    assert(!!table, 'allowed_activity table not found');

    const column = table.findColumnByName('unit_id');
    if (column) {
      // remove copied rows of renamed activitiy for acute care setting
      await queryRunner.query(`
        delete from allowed_activity aa where aa.created_by_id is null and
        aa.unit_id = (select id from unit u where u.name = 'acutecaremedicine')
      `);

      await queryRunner.dropColumn(table, column);

      await queryRunner.createUniqueConstraint(
        table,
        new TableUnique({
          name: 'occupation_careActivity',
          columnNames: ['occupation_id', 'care_activity_id'],
        }),
      );
    }
  }
}
