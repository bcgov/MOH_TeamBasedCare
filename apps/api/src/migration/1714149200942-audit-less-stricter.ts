import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLessStricter1714149200942 implements MigrationInterface {
  name = 'AuditLessStricter1714149200942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "occupation_history" DROP CONSTRAINT "FK_09110276b4a0a1b89b395450b50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" DROP CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" DROP CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" DROP CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" DROP CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" DROP CONSTRAINT "FK_e25c8918857c07506e1917b5e27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" DROP CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" DROP CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" DROP CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" DROP CONSTRAINT "FK_05829789933a8c6dad99ddea2b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" ALTER COLUMN "modified_by_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" ADD CONSTRAINT "FK_09110276b4a0a1b89b395450b50" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" ADD CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" ADD CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" ADD CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" ADD CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" ADD CONSTRAINT "FK_e25c8918857c07506e1917b5e27" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" ADD CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" ADD CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" ADD CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" ADD CONSTRAINT "FK_05829789933a8c6dad99ddea2b6" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bundle_history" DROP CONSTRAINT "FK_05829789933a8c6dad99ddea2b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" DROP CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" DROP CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" DROP CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" DROP CONSTRAINT "FK_e25c8918857c07506e1917b5e27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" DROP CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" DROP CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" DROP CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" DROP CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" DROP CONSTRAINT "FK_09110276b4a0a1b89b395450b50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" ADD CONSTRAINT "FK_05829789933a8c6dad99ddea2b6" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" ADD CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" ADD CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" ADD CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" ADD CONSTRAINT "FK_e25c8918857c07506e1917b5e27" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" ADD CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" ADD CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" ADD CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" ADD CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" ALTER COLUMN "modified_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" ADD CONSTRAINT "FK_09110276b4a0a1b89b395450b50" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
