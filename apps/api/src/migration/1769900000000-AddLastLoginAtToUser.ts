import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLoginAtToUser1769900000000 implements MigrationInterface {
  name = 'AddLastLoginAtToUser1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add last_login_at column (nullable)
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP`,
    );

    // Backfill: set lastLoginAt to updatedAt for users with keycloakId (have logged in before)
    await queryRunner.query(`
      UPDATE "users" SET "last_login_at" = "updated_at"
      WHERE "keycloak_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
  }
}
