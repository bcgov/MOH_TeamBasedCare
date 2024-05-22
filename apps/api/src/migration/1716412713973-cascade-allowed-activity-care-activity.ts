import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeAllowedActivityCareActivity1716412713973 implements MigrationInterface {
  name = 'CascadeAllowedActivityCareActivity1716412713973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_a3e8a30857e08338b51772a142b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_a3e8a30857e08338b51772a142b" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_a3e8a30857e08338b51772a142b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_a3e8a30857e08338b51772a142b" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
