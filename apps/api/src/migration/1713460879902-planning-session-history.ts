import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanningSessionHistory1713460879902 implements MigrationInterface {
  name = 'PlanningSessionHistory1713460879902';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "planning_session_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_dd5ea7024c8d60a0838f6742e87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" ADD CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planning_session_history" DROP CONSTRAINT "FK_58dbdb3cda0d3d789339503bb8f"`,
    );
    await queryRunner.query(`DROP TABLE "planning_session_history"`);
  }
}
