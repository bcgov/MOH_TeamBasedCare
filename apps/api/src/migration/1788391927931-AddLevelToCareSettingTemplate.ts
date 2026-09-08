import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the template level classification and the optimistic-concurrency token.
 *
 * The backfill rule mirrors how templates were created before levels existed:
 * a template copied directly from a master belongs to a health authority, and
 * anything copied further down belongs to a site. Master templates keep NULL,
 * which is displayed as "Provincial".
 *
 * No template row is deleted or re-parented.
 */
export class AddLevelToCareSettingTemplate1788391927931 implements MigrationInterface {
  name = 'AddLevelToCareSettingTemplate1788391927931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Level enum type
    await queryRunner.query(
      `CREATE TYPE "template_level_enum" AS ENUM ('health authority', 'site')`,
    );

    // 2. Nullable level column
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" ADD COLUMN "level" "template_level_enum"`,
    );

    // 3. Children of a master template are health authority templates
    await queryRunner.query(`
      UPDATE "care_setting_template" child
      SET "level" = 'health authority'
      FROM "care_setting_template" parent
      WHERE child."parent_id" = parent."id"
        AND parent."is_master" = true
        AND child."is_master" = false
    `);

    // 4. Every remaining non-master template is a site template. This includes
    //    orphans with no parent, which have no ancestry to infer from and are
    //    safest treated as the most specific level.
    await queryRunner.query(`
      UPDATE "care_setting_template"
      SET "level" = 'site'
      WHERE "is_master" = false
        AND "level" IS NULL
    `);

    // 5. Level is required for non-masters and forbidden for masters
    await queryRunner.query(`
      ALTER TABLE "care_setting_template"
      ADD CONSTRAINT "chk_care_setting_template_level"
      CHECK (
        ("is_master" = true AND "level" IS NULL)
        OR ("is_master" = false AND "level" IS NOT NULL)
      )
    `);

    // 6. Supports the level filter on the templates table
    await queryRunner.query(
      `CREATE INDEX "idx_care_setting_template_level" ON "care_setting_template" ("level")`,
    );

    // 7. Optimistic-concurrency token; every existing template starts at a known value
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" ADD COLUMN "version" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "care_setting_template" DROP COLUMN "version"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_care_setting_template_level"`);
    await queryRunner.query(
      `ALTER TABLE "care_setting_template" DROP CONSTRAINT IF EXISTS "chk_care_setting_template_level"`,
    );
    await queryRunner.query(`ALTER TABLE "care_setting_template" DROP COLUMN "level"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "template_level_enum"`);
  }
}
