import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureRequiredUnitsExist1741307582813 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure the required units exist for the AddUnitColumnToAllowedActivity migration
    
    // Check and create emergencydepartment unit if it doesn't exist
    const emergencyDeptCheck = await queryRunner.query(
      `SELECT id FROM unit WHERE name = 'emergencydepartment'`,
    );
    if (emergencyDeptCheck.length === 0) {
      await queryRunner.query(`
        INSERT INTO unit (name, display_name) 
        VALUES ('emergencydepartment', 'Emergency Department')
      `);
    }

    // Check and create acutecaremedicine unit if it doesn't exist
    const acuteCareCheck = await queryRunner.query(
      `SELECT id FROM unit WHERE name = 'acutecaremedicine'`,
    );
    if (acuteCareCheck.length === 0) {
      await queryRunner.query(`
        INSERT INTO unit (name, display_name) 
        VALUES ('acutecaremedicine', 'Acute Care Medicine')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the units we created (only if they don't have any relationships)
    await queryRunner.query(`
      DELETE FROM unit 
      WHERE name IN ('emergencydepartment', 'acutecaremedicine') 
      AND id NOT IN (
        SELECT DISTINCT unit_id FROM care_activity_care_locations_unit 
        WHERE unit_id IS NOT NULL
        UNION
        SELECT DISTINCT unit_id FROM allowed_activity 
        WHERE unit_id IS NOT NULL
        UNION
        SELECT DISTINCT care_location_id FROM planning_session 
        WHERE care_location_id IS NOT NULL
      )
    `);
  }
}
