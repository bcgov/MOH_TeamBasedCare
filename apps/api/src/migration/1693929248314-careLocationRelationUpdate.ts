import { MigrationInterface, QueryRunner } from 'typeorm';

export class careLocationRelationUpdate1693929248314 implements MigrationInterface {
  name = 'careLocationRelationUpdate1693929248314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "care_activity_care_locations_unit" ("care_activity_id" uuid NOT NULL, "unit_id" uuid NOT NULL, CONSTRAINT "PK_8536ed82344ce111811687ecf2e" PRIMARY KEY ("care_activity_id", "unit_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d6a0131c8c6374cda5e953065" ON "care_activity_care_locations_unit" ("care_activity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_674a4833ac0183f68281e21f61" ON "care_activity_care_locations_unit" ("unit_id") `,
    );

    await queryRunner.query(`ALTER TABLE "unit" ADD "name" character varying(255)`);
    await queryRunner.query(
      `UPDATE "unit" SET "name" = regexp_replace(LOWER("unit_name"), '\W', '', 'gm')`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_5618100486bb99d78de022e5829" UNIQUE ("name")`,
    );
    await queryRunner.query(`ALTER TABLE "unit" ALTER COLUMN "name" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "unit" ADD "display_name" character varying(255)`);
    await queryRunner.query(`UPDATE "unit" SET "display_name" = "unit_name"`);
    await queryRunner.query(`ALTER TABLE "unit" ALTER COLUMN "display_name" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "UQ_2b7d9e98d5c89487750c5d227ef"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "unit_name"`);

    await queryRunner.query(`CREATE INDEX "IDX_5618100486bb99d78de022e582" ON "unit" ("name") `);
    await queryRunner.query(
      `ALTER TABLE "care_activity_care_locations_unit" ADD CONSTRAINT "FK_4d6a0131c8c6374cda5e9530652" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_care_locations_unit" ADD CONSTRAINT "FK_674a4833ac0183f68281e21f61a" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    // insert data to care_activity_care_locations_unit
    // currently, for the purpose of the demo, there's only one UNIT inserted and all the activities belong to that [ICU]
    // any further units that will be inserted shall be done via the API - and
    await queryRunner.query(
      `INSERT INTO "care_activity_care_locations_unit"("care_activity_id", "unit_id") SELECT ca.id as care_activity_id, u.id as unit_id from "care_activity" ca, "unit" u`,
    );

    // TODO: DROP unnecessary table and related constraints for "unit_care_activities_care_activity"
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_activity_care_locations_unit" DROP CONSTRAINT "FK_674a4833ac0183f68281e21f61a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_care_locations_unit" DROP CONSTRAINT "FK_4d6a0131c8c6374cda5e9530652"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_5618100486bb99d78de022e582"`);

    await queryRunner.query(`ALTER TABLE "unit" ADD "unit_name" character varying(255)`);
    await queryRunner.query(`UPDATE "unit" SET "unit_name" = "display_name"`);
    await queryRunner.query(`ALTER TABLE "unit" ALTER COLUMN "unit_name" SET NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_2b7d9e98d5c89487750c5d227ef" UNIQUE ("unit_name")`,
    );

    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "display_name"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "UQ_5618100486bb99d78de022e5829"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "name"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_674a4833ac0183f68281e21f61"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4d6a0131c8c6374cda5e953065"`);
    await queryRunner.query(`DROP TABLE "care_activity_care_locations_unit"`);
  }
}
