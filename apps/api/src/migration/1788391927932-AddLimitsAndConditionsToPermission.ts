import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the limits-and-conditions catalogue and links a permission to at most
 * one catalogue entry, plus an optional restriction description.
 *
 * The seeded entries are the business-approved clinical wording.
 *
 * Existing LC permissions are intentionally NOT backfilled — there is no
 * correct value to invent. The service grants those rows an exemption so an
 * untouched legacy cell cannot block an otherwise-valid save.
 */
export class AddLimitsAndConditionsToPermission1788391927932 implements MigrationInterface {
  name = 'AddLimitsAndConditionsToPermission1788391927932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Catalogue table
    await queryRunner.query(`
      CREATE TABLE "limit_condition" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_limit_condition" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_unique_limit_condition_name" ON "limit_condition" (LOWER("name"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_limit_condition_is_active" ON "limit_condition" ("is_active")`,
    );

    // 2. Business-approved catalogue. Ordered as supplied, which is the order
    //    the picker presents them in; descriptions are left null because the
    //    names are the approved wording on their own.
    await queryRunner.query(`
      INSERT INTO "limit_condition" ("name", "sort_order") VALUES
        ('Additional Training', 1),
        ('Additional Education', 2),
        ('Certification', 3),
        ('Clinical setting specific w add''l education', 4),
        ('Clinical setting specific w/o add''l education', 5)
    `);

    // 3. Optional free-text explanation on a permission
    await queryRunner.query(
      `ALTER TABLE "care_setting_template_permission" ADD COLUMN "restriction_description" text`,
    );

    // 4. At most one catalogue entry per permission
    await queryRunner.query(
      `ALTER TABLE "care_setting_template_permission" ADD COLUMN "limit_condition_id" uuid`,
    );

    await queryRunner.query(`
      ALTER TABLE "care_setting_template_permission"
      ADD CONSTRAINT "fk_permission_limit_condition"
      FOREIGN KEY ("limit_condition_id") REFERENCES "limit_condition" ("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_permission_limit_condition" ON "care_setting_template_permission" ("limit_condition_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permission_limit_condition"`);
    await queryRunner.query(
      `ALTER TABLE "care_setting_template_permission" DROP CONSTRAINT IF EXISTS "fk_permission_limit_condition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_setting_template_permission" DROP COLUMN IF EXISTS "limit_condition_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_setting_template_permission" DROP COLUMN IF EXISTS "restriction_description"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "limit_condition"`);
  }
}
