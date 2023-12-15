import { MigrationInterface, QueryRunner } from 'typeorm';

export class careActivitySearchTerm1702504051954 implements MigrationInterface {
  name = 'careActivitySearchTerm1702504051954';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "care_activity_search_term" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "term" character varying(255) NOT NULL, "created_by" character varying(255) NOT NULL, "created_by_username" character varying(255) NOT NULL, "created_by_name" character varying(255) NOT NULL, "created_by_email" character varying(255) NOT NULL, CONSTRAINT "PK_5570a5a1d7e56ad507ac9052d78" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "care_activity_search_term"`);
  }
}
