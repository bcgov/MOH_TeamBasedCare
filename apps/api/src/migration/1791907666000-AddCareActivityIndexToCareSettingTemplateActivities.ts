import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareActivityIndexToCareSettingTemplateActivities1791907666000
  implements MigrationInterface
{
  name = 'AddCareActivityIndexToCareSettingTemplateActivities1791907666000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_care_setting_template_activities_care_activity_id"
      ON "care_setting_template_activities" ("care_activity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_care_setting_template_activities_care_activity_id"`,
    );
  }
}
