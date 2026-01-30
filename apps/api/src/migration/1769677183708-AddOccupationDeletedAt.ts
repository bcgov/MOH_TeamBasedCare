import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOccupationDeletedAt1769677183708 implements MigrationInterface {
  name = 'AddOccupationDeletedAt1769677183708';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "occupation" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "deleted_at"`);
  }
}
