import { MigrationInterface, QueryRunner } from 'typeorm';

export class careActivity1663627736203 implements MigrationInterface {
  name = 'careActivity1663627736203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "planning_session_care_activity_care_activity" ("planning_session_id" uuid NOT NULL, "care_activity_id" uuid NOT NULL, CONSTRAINT "PK_d82460676fe34967df240014116" PRIMARY KEY ("planning_session_id", "care_activity_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17cb5d494a09a710c5e9fc9b46" ON "planning_session_care_activity_care_activity" ("planning_session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de40dcbe84a04fe39bb0169b77" ON "planning_session_care_activity_care_activity" ("care_activity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "planning_session_occupation_occupation" ("planning_session_id" uuid NOT NULL, "occupation_id" uuid NOT NULL, CONSTRAINT "PK_8ce751e0484a583d137a5899ce9" PRIMARY KEY ("planning_session_id", "occupation_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_697c8c8cce89e7b717b1c3f3b5" ON "planning_session_occupation_occupation" ("planning_session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e518c06c9aa56046693310f47" ON "planning_session_occupation_occupation" ("occupation_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_care_activity_care_activity" ADD CONSTRAINT "FK_17cb5d494a09a710c5e9fc9b461" FOREIGN KEY ("planning_session_id") REFERENCES "planning_session"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_care_activity_care_activity" ADD CONSTRAINT "FK_de40dcbe84a04fe39bb0169b77d" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_occupation_occupation" ADD CONSTRAINT "FK_697c8c8cce89e7b717b1c3f3b55" FOREIGN KEY ("planning_session_id") REFERENCES "planning_session"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_occupation_occupation" ADD CONSTRAINT "FK_9e518c06c9aa56046693310f47f" FOREIGN KEY ("occupation_id") REFERENCES "occupation"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planning_session_occupation_occupation" DROP CONSTRAINT "FK_9e518c06c9aa56046693310f47f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_occupation_occupation" DROP CONSTRAINT "FK_697c8c8cce89e7b717b1c3f3b55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_care_activity_care_activity" DROP CONSTRAINT "FK_de40dcbe84a04fe39bb0169b77d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session_care_activity_care_activity" DROP CONSTRAINT "FK_17cb5d494a09a710c5e9fc9b461"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9e518c06c9aa56046693310f47"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_697c8c8cce89e7b717b1c3f3b5"`);
    await queryRunner.query(`DROP TABLE "planning_session_occupation_occupation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de40dcbe84a04fe39bb0169b77"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17cb5d494a09a710c5e9fc9b46"`);
    await queryRunner.query(`DROP TABLE "planning_session_care_activity_care_activity"`);
  }
}
