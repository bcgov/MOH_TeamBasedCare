// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class userAndPreference1706308289707 implements MigrationInterface {
//   name = 'userAndPreference1706308289707';

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(
//       `CREATE TABLE "user" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "keycloak_id" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "username" character varying(255) NOT NULL, "display_name" character varying(255) NOT NULL, "organization" character varying(255), "user_preference_id" uuid, CONSTRAINT "UQ_7dbb864d96a41e12fe53e016f21" UNIQUE ("keycloak_id"), CONSTRAINT "REL_3c805106c218f3a96b1cd47511" UNIQUE ("user_preference_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
//     );
//     await queryRunner.query(
//       `CREATE TABLE "user_preference" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "not_show_confirm_draft_removal" boolean, CONSTRAINT "PK_0532217bd629d0ccf06499c5841" PRIMARY KEY ("id"))`,
//     );
//     await queryRunner.query(
//       `ALTER TABLE "user" ADD CONSTRAINT "FK_3c805106c218f3a96b1cd47511b" FOREIGN KEY ("user_preference_id") REFERENCES "user_preference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
//     );
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_3c805106c218f3a96b1cd47511b"`);
//     await queryRunner.query(`DROP TABLE "user_preference"`);
//     await queryRunner.query(`DROP TABLE "user"`);
//   }
// }
