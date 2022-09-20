import { MigrationInterface, QueryRunner } from 'typeorm';

export class saveProfile1663617416011 implements MigrationInterface {
  name = 'saveProfile1663617416011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "profile" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "profile"`);
  }
}
