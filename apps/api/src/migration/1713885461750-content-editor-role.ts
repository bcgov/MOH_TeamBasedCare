import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentEditorRole1713885461750 implements MigrationInterface {
  name = 'ContentEditorRole1713885461750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_roles_enum" RENAME TO "users_roles_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('ADMIN', 'USER', 'CONTENT_ADMIN')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum"[] USING "roles"::"text"::"public"."users_roles_enum"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_roles_enum_old" AS ENUM('ADMIN', 'USER')`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum_old"[] USING "roles"::"text"::"public"."users_roles_enum_old"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_roles_enum_old" RENAME TO "users_roles_enum"`,
    );
  }
}
