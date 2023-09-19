import { MigrationInterface, QueryRunner } from 'typeorm';

export class uniquenessInAllowedActivity1694721151975 implements MigrationInterface {
  name = 'uniquenessInAllowedActivity1694721151975';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "occupation_careActivity" UNIQUE ("occupation_id", "care_activity_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "occupation_careActivity"`,
    );
  }
}
