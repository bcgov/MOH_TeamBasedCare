import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserLastAccessAtRemoved1713302649042 implements MigrationInterface {
  name = 'UserLastAccessAtRemoved1713302649042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_access_at"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "last_access_at" TIMESTAMP`);
  }
}
