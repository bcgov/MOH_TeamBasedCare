import { MigrationInterface, QueryRunner } from 'typeorm';

export class updatedAppDataFrom29Sep20231696447301667 implements MigrationInterface {
  name = 'updatedAppDataFrom29Sep20231696447301667';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Remove all the existing data
     */
    await queryRunner.query(`
     delete from "public"."allowed_activity";
     delete from "public"."care_activity";
     delete from "public"."bundle";
     delete from "public"."planning_session";
     delete from "public"."unit";
     delete from "public"."occupation";
     `);

    /**
     * Update Permissions enum
     */
    await queryRunner.query(
      `ALTER TYPE "public"."allowed_activity_permission_enum" RENAME TO "allowed_activity_permission_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."allowed_activity_permission_enum" AS ENUM('X', 'L')`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ALTER COLUMN "permission" TYPE "public"."allowed_activity_permission_enum" USING "permission"::"text"::"public"."allowed_activity_permission_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."allowed_activity_permission_enum_old"`);

    /**
     * Clinical Type not null
     */
    await queryRunner.query(
      `ALTER TABLE "care_activity" ALTER COLUMN "clinical_type" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_activity" ALTER COLUMN "clinical_type" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."allowed_activity_permission_enum_old" AS ENUM('X', 'A', 'C(E)', 'L')`,
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
