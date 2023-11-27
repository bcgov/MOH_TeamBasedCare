import { MigrationInterface, QueryRunner } from 'typeorm';

export class feedbackEntity1701125762627 implements MigrationInterface {
  name = 'feedbackEntity1701125762627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying(4096) NOT NULL, "created_by_email" character varying(255) NOT NULL, "created_by_name" character varying(255) NOT NULL, "created_by_username" character varying(255) NOT NULL, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
  }
}
