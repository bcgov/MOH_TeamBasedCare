import { MigrationInterface, QueryRunner } from 'typeorm';

export class entitiesUpdateCreatedBy1701371126686 implements MigrationInterface {
  name = 'entitiesUpdateCreatedBy1701371126686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // createdBy @ feedback
    await queryRunner.query(`ALTER TABLE "feedback" ADD "created_by" character varying(255)`);

    // createdByEmail
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_email" character varying(255)`,
    );

    // createdBy: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by" TO "created_by_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by" character varying(255)`,
    );
    await queryRunner.query(`UPDATE "planning_session" SET "created_by" = "created_by_old"`);
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_old"`);

    // createdByUsername: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by_username" TO "created_by_username_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_username" character varying(255)`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "created_by_username" = "created_by_username_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_username" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_username_old"`);

    // created_by_name: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by_name" TO "created_by_name_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_name" character varying(255)`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "created_by_name" = "created_by_name_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_name" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_name_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // created_by_name: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by_name" TO "created_by_name_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_name" character varying`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "created_by_name" = "created_by_name_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_name" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_name_old"`);

    // createdByUsername: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by_username" TO "created_by_username_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_username" character varying`,
    );
    await queryRunner.query(
      `UPDATE "planning_session" SET "created_by_username" = "created_by_username_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_username" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_username_old"`);

    // createdBy: update data before removing columns
    await queryRunner.query(
      `ALTER TABLE "planning_session" RENAME COLUMN "created_by" TO "created_by_old"`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "created_by" character varying`);
    await queryRunner.query(`UPDATE "planning_session" SET "created_by" = "created_by_old"`);
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_old"`);

    // createdByEmail
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_email"`);

    // createdBy @ feedback
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by"`);
  }
}
