import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameToPlanningSession1788197996146 implements MigrationInterface {
  name = 'AddNameToPlanningSession1788197996146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: add the column nullable so existing rows can be backfilled
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD COLUMN IF NOT EXISTS "name" character varying(100)`,
    );

    // Step 2: backfill from the care setting display name and creation date.
    // 'Planning' is used only for legacy rows whose template was deleted
    // (care_setting_template_id is ON DELETE SET NULL).
    await queryRunner.query(`
      UPDATE "planning_session" ps
      SET "name" = LEFT(
        COALESCE(cst."name", u."display_name", 'Planning'),
        100 - 13
      ) || ' - ' || TO_CHAR(ps."created_at", 'YYYY-MM-DD')
      FROM "planning_session" src
      LEFT JOIN "care_setting_template" cst ON cst."id" = src."care_setting_template_id"
      LEFT JOIN "unit" u ON u."id" = src."care_location_id"
      WHERE ps."id" = src."id"
        AND (ps."name" IS NULL OR TRIM(ps."name") = '')
    `);

    // Step 3: de-duplicate within each owner. ROW_NUMBER() yields 2, 3, 4 ... in
    // creation order, which matches the counter the runtime name generator produces.
    await queryRunner.query(`
      UPDATE "planning_session" ps
      SET "name" = LEFT(ps."name", 100 - LENGTH(' (' || sub.rn || ')')) || ' (' || sub.rn || ')'
      FROM (
        SELECT "id", ROW_NUMBER() OVER (
          PARTITION BY "created_by_id", LOWER(TRIM("name"))
          ORDER BY "created_at" ASC, "id" ASC
        ) AS rn
        FROM "planning_session"
      ) sub
      WHERE ps."id" = sub."id" AND sub.rn > 1
    `);

    // Step 4: backstop any row the backfill could not name
    await queryRunner.query(`
      UPDATE "planning_session"
      SET "name" = 'Planning - ' || "id"
      WHERE "name" IS NULL OR TRIM("name") = ''
    `);

    // Step 5: enforce presence
    await queryRunner.query(`ALTER TABLE "planning_session" ALTER COLUMN "name" SET NOT NULL`);

    // Step 6: name unique per owner, case- and whitespace-insensitive
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_planning_session_name_per_owner"
      ON "planning_session" ("created_by_id", LOWER(TRIM("name")))
    `);

    // Step 7: support the owner-scoped listing query
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_planning_session_created_by_status"
      ON "planning_session" ("created_by_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_planning_session_created_by_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_unique_planning_session_name_per_owner"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN IF EXISTS "name"`);
  }
}
