import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeAllowedActivityCareActivity1716313096519 implements MigrationInterface {
  name = 'CascadeAllowedActivityCareActivity1716313096519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT IF EXISTS "FK_a3e8a30857e08338b51772a142b"`,
    );

    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_478932d64ff6fa0e9ed2bd8f1bc" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT IF EXISTS "FK_478932d64ff6fa0e9ed2bd8f1bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_a3e8a30857e08338b51772a142b" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
