import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoPermissionValue1769648097856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'N' value to the permission enum
    await queryRunner.query(`
      ALTER TYPE care_setting_template_permission_permission_enum ADD VALUE IF NOT EXISTS 'N'
    `);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For safety, we leave this as a no-op
  }
}
