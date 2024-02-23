import { MigrationInterface, QueryRunner } from 'typeorm';

export class usersAndPreference1708660342442 implements MigrationInterface {
  name = 'usersAndPreference1708660342442';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('ADMIN', 'USER')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{}', "keycloak_id" character varying(255), "username" character varying(255), "first_name" character varying(255), "family_name" character varying(255), "display_name" character varying(255), "organization" character varying(255), "last_access_at" TIMESTAMP, "revoked_at" TIMESTAMP, "user_preference_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_a32ebf09b0ac0b9a02139c1554" UNIQUE ("user_preference_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_preference" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "not_show_confirm_draft_removal" boolean, CONSTRAINT "PK_0532217bd629d0ccf06499c5841" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a32ebf09b0ac0b9a02139c1554f" FOREIGN KEY ("user_preference_id") REFERENCES "user_preference"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a32ebf09b0ac0b9a02139c1554f"`);
    await queryRunner.query(`DROP TABLE "user_preference"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
  }
}
