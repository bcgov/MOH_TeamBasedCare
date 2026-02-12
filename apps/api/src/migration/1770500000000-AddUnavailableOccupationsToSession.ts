import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnavailableOccupationsToSession1770500000000 implements MigrationInterface {
  name = 'AddUnavailableOccupationsToSession1770500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unavailable_occupations column (simple-array stores as comma-separated text)
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD COLUMN "unavailable_occupations" text DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP COLUMN IF EXISTS "unavailable_occupations"`,
    );
  }
}
