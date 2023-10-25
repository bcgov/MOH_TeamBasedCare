import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialSchema1664816378062 implements MigrationInterface {
  name = 'initialSchema1664816378062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Issue: the enum does not exist in PROD
    // weirdly, it is working ok in dev and test. Perhaps, the types/enum were created manually there :shrug:
    // Fix: Creating the necessary types in the migration yet to be run in the PROD
    await queryRunner.query(
      `CREATE TYPE "public"."allowed_activity_permission_enum" AS ENUM('X', 'A', 'C(E)', 'L')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."care_activity_activity_type_enum" AS ENUM('Aspect of Practice', 'Task', 'Restricted Activity')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."care_activity_clinical_type_enum" AS ENUM('Clinical', 'Clinical Support')`,
    );

    // Rest of queries
    await queryRunner.query(
      `CREATE TABLE "occupation" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "display_name" character varying(255) NOT NULL, "is_regulated" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_47dc90a06f122e0b7256fa1e5fd" UNIQUE ("name"), CONSTRAINT "PK_07cfcefef555693d96dce8805c5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "allowed_activity" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permission" "public"."allowed_activity_permission_enum" NOT NULL, "occupation_id" uuid NOT NULL, "care_activity_id" uuid NOT NULL, CONSTRAINT "PK_f978d04099726f3bcc9081b38de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "care_activity" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "display_name" character varying(255) NOT NULL, "description" character varying(3000), "activity_type" "public"."care_activity_activity_type_enum" NOT NULL, "clinical_type" "public"."care_activity_clinical_type_enum" NOT NULL, "bundle_id" uuid, CONSTRAINT "UQ_53cdb7812bb7ae2b71b7b79c074" UNIQUE ("name"), CONSTRAINT "PK_77b9c1e1b02f904ffdde182999b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bundle" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "display_name" character varying(255) NOT NULL, "description" character varying(3000), CONSTRAINT "UQ_1b90f09fa1b9387b41685191ce7" UNIQUE ("name"), CONSTRAINT "PK_637e3f87e837d6532109c198dea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "planning_session" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile" jsonb, CONSTRAINT "PK_e41eaa1c1d23ef50b31ca510905" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "unit" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unit_name" character varying(255) NOT NULL, CONSTRAINT "UQ_2b7d9e98d5c89487750c5d227ef" UNIQUE ("unit_name"), CONSTRAINT "PK_4252c4be609041e559f0c80f58a" PRIMARY KEY ("id"))`,
    );
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
      `CREATE TABLE "unit_care_activities_care_activity" ("unit_id" uuid NOT NULL, "care_activity_id" uuid NOT NULL, CONSTRAINT "PK_588924c7f83c9bccc8a6af4b714" PRIMARY KEY ("unit_id", "care_activity_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f40a7299c44649cd675d32e1c" ON "unit_care_activities_care_activity" ("unit_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df4ba54c8bd68daf5a542246d8" ON "unit_care_activities_care_activity" ("care_activity_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_0d37a8bcbc60bac52739e86e215" FOREIGN KEY ("occupation_id") REFERENCES "occupation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_a3e8a30857e08338b51772a142b" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity" ADD CONSTRAINT "FK_69e10eb473b138458c21cea2270" FOREIGN KEY ("bundle_id") REFERENCES "bundle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "unit_care_activities_care_activity" ADD CONSTRAINT "FK_3f40a7299c44649cd675d32e1cb" FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_care_activities_care_activity" ADD CONSTRAINT "FK_df4ba54c8bd68daf5a542246d83" FOREIGN KEY ("care_activity_id") REFERENCES "care_activity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "unit_care_activities_care_activity" DROP CONSTRAINT "FK_df4ba54c8bd68daf5a542246d83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_care_activities_care_activity" DROP CONSTRAINT "FK_3f40a7299c44649cd675d32e1cb"`,
    );
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
    await queryRunner.query(
      `ALTER TABLE "care_activity" DROP CONSTRAINT "FK_69e10eb473b138458c21cea2270"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_a3e8a30857e08338b51772a142b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_0d37a8bcbc60bac52739e86e215"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_df4ba54c8bd68daf5a542246d8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3f40a7299c44649cd675d32e1c"`);
    await queryRunner.query(`DROP TABLE "unit_care_activities_care_activity"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9e518c06c9aa56046693310f47"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_697c8c8cce89e7b717b1c3f3b5"`);
    await queryRunner.query(`DROP TABLE "planning_session_occupation_occupation"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de40dcbe84a04fe39bb0169b77"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17cb5d494a09a710c5e9fc9b46"`);
    await queryRunner.query(`DROP TABLE "planning_session_care_activity_care_activity"`);
    await queryRunner.query(`DROP TABLE "unit"`);
    await queryRunner.query(`DROP TABLE "planning_session"`);
    await queryRunner.query(`DROP TABLE "bundle"`);
    await queryRunner.query(`DROP TABLE "care_activity"`);
    await queryRunner.query(`DROP TABLE "allowed_activity"`);
    await queryRunner.query(`DROP TABLE "occupation"`);
    await queryRunner.query(`DROP TYPE "public"."allowed_activity_permission_enum"`);
    await queryRunner.query(`DROP TYPE "public"."care_activity_activity_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."care_activity_clinical_type_enum"`);
  }
}
