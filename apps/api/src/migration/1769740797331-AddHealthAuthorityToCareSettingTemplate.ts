import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHealthAuthorityToCareSettingTemplate1769740797331 implements MigrationInterface {
  name = 'AddHealthAuthorityToCareSettingTemplate1769740797331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add health_authority column (nullable initially)
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" ADD COLUMN "health_authority" VARCHAR(255)`,
    );

    // Populate user templates from creator's organization
    await queryRunner.query(`
      UPDATE "care_setting_template" t
      SET "health_authority" = u."organization"
      FROM "users" u
      WHERE t."created_by_id" = u."id"
        AND u."organization" IS NOT NULL
    `);

    // Mark master templates as GLOBAL (visible to all health authorities)
    await queryRunner.query(`
      UPDATE "care_setting_template"
      SET "health_authority" = 'GLOBAL'
      WHERE "is_master" = true
    `);

    // Set remaining templates without health_authority to GLOBAL as fallback
    await queryRunner.query(`
      UPDATE "care_setting_template"
      SET "health_authority" = 'GLOBAL'
      WHERE "health_authority" IS NULL
    `);

    // Add index for performance
    await queryRunner.query(
      `CREATE INDEX "idx_care_setting_template_health_authority" ON "care_setting_template" ("health_authority")`,
    );

    // Make column non-nullable now that all data is populated
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" ALTER COLUMN "health_authority" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_care_setting_template_health_authority"`,
    );

    // Drop column
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" DROP COLUMN "health_authority"`,
    );
  }
}
