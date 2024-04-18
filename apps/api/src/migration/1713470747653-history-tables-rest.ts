import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryTablesRest1713470747653 implements MigrationInterface {
  name = 'HistoryTablesRest1713470747653';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "unit_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_faa81e25a633aea2a8393853064" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_045864fa4d3f458c5f6bb9ab334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "occupation_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_a32c86a37c83d9539cedd3f2d15" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_777252b9045d8011ab83c5b0834" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "care_activity_search_term_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_22609534d5bbeca2bf0e5e1f0e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "allowed_activity_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_4d08e4e58856de92ccfd6b42520" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bundle_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_5fc121edd61098e2127ddbb1d63" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "care_activity_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_15107f27f9fd43c94ee0c088261" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_preference_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(20) NOT NULL, "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb NOT NULL, "modified_by_id" uuid NOT NULL, CONSTRAINT "PK_e99ecb0f64b3b780c03e7657df8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" ADD CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" ADD CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" ADD CONSTRAINT "FK_09110276b4a0a1b89b395450b50" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" ADD CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" ADD CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" ADD CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" ADD CONSTRAINT "FK_05829789933a8c6dad99ddea2b6" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" ADD CONSTRAINT "FK_e25c8918857c07506e1917b5e27" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" ADD CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_preference_history" DROP CONSTRAINT "FK_ba40c75320d8769c4770a8ad3d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_history" DROP CONSTRAINT "FK_e25c8918857c07506e1917b5e27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle_history" DROP CONSTRAINT "FK_05829789933a8c6dad99ddea2b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity_history" DROP CONSTRAINT "FK_0e9d6ed2400c714e7b065db56b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term_history" DROP CONSTRAINT "FK_e740f96d3f957e9b511d0fa32d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_history" DROP CONSTRAINT "FK_3ec4b6722ad1e9117a0d3750163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation_history" DROP CONSTRAINT "FK_09110276b4a0a1b89b395450b50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_history" DROP CONSTRAINT "FK_8d020ee80516ea3df7fb0ba6795"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit_history" DROP CONSTRAINT "FK_5d2c30a7627636c7e7ab064191a"`,
    );
    await queryRunner.query(`DROP TABLE "user_preference_history"`);
    await queryRunner.query(`DROP TABLE "care_activity_history"`);
    await queryRunner.query(`DROP TABLE "bundle_history"`);
    await queryRunner.query(`DROP TABLE "allowed_activity_history"`);
    await queryRunner.query(`DROP TABLE "care_activity_search_term_history"`);
    await queryRunner.query(`DROP TABLE "user_history"`);
    await queryRunner.query(`DROP TABLE "occupation_history"`);
    await queryRunner.query(`DROP TABLE "feedback_history"`);
    await queryRunner.query(`DROP TABLE "unit_history"`);
  }
}
