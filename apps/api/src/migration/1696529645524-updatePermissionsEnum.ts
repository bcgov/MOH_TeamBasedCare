import { MigrationInterface, QueryRunner } from 'typeorm';

export class updatePermissionsEnum1696529645524 implements MigrationInterface {
  name = 'updatePermissionsEnum1696529645524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."allowed_activity_permission_enum" RENAME TO "allowed_activity_permission_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."allowed_activity_permission_enum" AS ENUM('Y', 'LC')`,
    );

    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ALTER COLUMN "permission" TYPE character varying(255)`,
    );

    // update data to accommodate new enum values
    await queryRunner.query(
      `UPDATE "allowed_activity" SET "permission" = 'Y' WHERE "permission" = 'X'`,
    );
    await queryRunner.query(
      `UPDATE "allowed_activity" SET "permission" = 'LC' WHERE "permission" = 'L'`,
    );

    // update to enum type again
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ALTER COLUMN "permission" TYPE "public"."allowed_activity_permission_enum" USING "permission"::"text"::"public"."allowed_activity_permission_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."allowed_activity_permission_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."allowed_activity_permission_enum_old" AS ENUM('X', 'L')`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ALTER COLUMN "permission" TYPE "public"."allowed_activity_permission_enum_old" USING "permission"::"text"::"public"."allowed_activity_permission_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."allowed_activity_permission_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."allowed_activity_permission_enum_old" RENAME TO "allowed_activity_permission_enum"`,
    );
  }
}
