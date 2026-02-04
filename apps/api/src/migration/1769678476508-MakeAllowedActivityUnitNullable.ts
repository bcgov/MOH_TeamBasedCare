import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAllowedActivityUnitNullable1769678476508 implements MigrationInterface {
  name = 'MakeAllowedActivityUnitNullable1769678476508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "allowed_activity" ALTER COLUMN "unit_id" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "allowed_activity" ALTER COLUMN "unit_id" SET NOT NULL`);
  }
}
