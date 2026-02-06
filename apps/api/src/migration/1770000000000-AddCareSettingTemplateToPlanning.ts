import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareSettingTemplateToPlanning1770000000000 implements MigrationInterface {
  name = 'AddCareSettingTemplateToPlanning1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add care_setting_template_id column to planning_session
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD COLUMN "care_setting_template_id" uuid`,
    );

    // Add foreign key with ON DELETE SET NULL
    await queryRunner.query(`
      ALTER TABLE "planning_session"
      ADD CONSTRAINT "FK_planning_session_care_setting_template"
      FOREIGN KEY ("care_setting_template_id")
      REFERENCES "care_setting_template"("id")
      ON DELETE SET NULL
    `);

    // Add index for performance
    await queryRunner.query(
      `CREATE INDEX "idx_planning_session_template" ON "planning_session" ("care_setting_template_id")`,
    );

    // Migrate DRAFT sessions to point to their master template
    await queryRunner.query(`
      UPDATE planning_session ps
      SET care_setting_template_id = (
        SELECT cst.id FROM care_setting_template cst
        WHERE cst.unit_id = ps.care_location_id
          AND cst.is_master = true
          AND cst.health_authority = 'GLOBAL'
        ORDER BY cst.created_at ASC
        LIMIT 1
      )
      WHERE ps.care_setting_template_id IS NULL
        AND ps.care_location_id IS NOT NULL
        AND ps.status = 'DRAFT'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_planning_session_template"`);

    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "planning_session"
      DROP CONSTRAINT IF EXISTS "FK_planning_session_care_setting_template"
    `);

    // Drop column
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP COLUMN IF EXISTS "care_setting_template_id"`,
    );
  }
}
