import { MigrationInterface, QueryRunner } from 'typeorm';

export class planningSessionUserAndStatusUpdates1695860040437 implements MigrationInterface {
  name = 'planningSessionUserAndStatusUpdates1695860040437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // removing existing session records for
    // one, to allow new NOT NULL constraints to pass
    // two, as added sessions are no longer usable; Going forward user will only have one active draft session
    await queryRunner.query(`DELETE FROM "planning_session"`);

    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_username" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "status" character varying NOT NULL DEFAULT 'draft'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_name"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_username"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by"`);
  }
}
