import { MigrationInterface, QueryRunner } from 'typeorm';

export class planningSessionWithUnitRelation1693944750805 implements MigrationInterface {
  name = 'planningSessionWithUnitRelation1693944750805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // unnecessary planning sessions
    await queryRunner.query(`DELETE FROM "planning_session" where "profile" IS NULL`);

    // profile_option - defaulted to scratch for existing records
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "profile_option" character varying`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "profile_option" = "profile" ->> 'profile'`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "profile_option" = 'scratch' where "profile" ->> 'profile' IS NULL`,
    );

    // drop profile column
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "profile"`);

    // care location / unit :: assuming care location was never saved
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "care_location_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD CONSTRAINT "FK_75008faf1df43554bee4218692b" FOREIGN KEY ("care_location_id") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // update existing care location data to ICU unit FK
    await queryRunner.query(
      `UPDATE "planning_session" SET care_location_id = (select id from unit where name = 'icu')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP CONSTRAINT "FK_75008faf1df43554bee4218692b"`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "care_location_id"`);
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "profile" jsonb`);
    await queryRunner.query(
      `UPDATE "planning_session" SET "profile" = '{ "profile": "scratch", "careLocation": "" }'::jsonb`,
    );

    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "profile_option"`);
  }
}
