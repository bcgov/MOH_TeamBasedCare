import { MigrationInterface, QueryRunner } from 'typeorm';

export class migrateExistingData1709228812566 implements MigrationInterface {
  name = 'migrateExistingData1709228812566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration deals with migration existing user data from 3 tables:
    // care_activity_search_term, feedback, planning_session

    /**
     * Migrate existing "care_activity_search_term" data;
     * Plan mentioned in steps below
     */

    // Step 1: Add created_by_id column allow NULL
    await queryRunner.query(`ALTER TABLE "care_activity_search_term" ADD "created_by_id" uuid`);

    // Step 2: Insert into "users" from existing "care_activity_search_term" table
    await queryRunner.query(`
        INSERT INTO "users" (roles, email, display_name, username, keycloak_id)
        select '{"USER"}' as roles, created_by_email, created_by_name, created_by_username, created_by from "care_activity_search_term" 
        ON CONFLICT DO NOTHING
    `);

    // Step 3: Update created_by_id from "users" table
    await queryRunner.query(`
        UPDATE "care_activity_search_term"
        SET created_by_id = u.id
        FROM "users" u
        WHERE created_by_email = u.email AND created_by = u.keycloak_id
    `);

    // Step 4: Alter created_by_id not allowing NULL
    await queryRunner.query(`
        ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_id" SET NOT NULL
    `);

    // Step 5: Drop columns created_by_email, created_by_name, created_by_username, created_by
    await queryRunner.query(`ALTER TABLE "care_activity_search_term" DROP COLUMN "created_by"`);
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP COLUMN "created_by_username"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP COLUMN "created_by_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP COLUMN "created_by_email"`,
    );

    // Step 6: Add Foreign Key constraint to User
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    /**
     * Migrate existing "feedback" data;
     * Plan mentioned in steps below
     */

    // Step 1: Add created_by_id column allow NULL
    await queryRunner.query(`ALTER TABLE "feedback" ADD "created_by_id" uuid`);

    // Step 2: Insert into "users" from existing "feedback" table
    await queryRunner.query(`
        INSERT INTO "users" (roles, email, display_name, username, keycloak_id)
        select '{"USER"}' as roles, created_by_email, created_by_name, created_by_username, created_by from "feedback" 
        ON CONFLICT DO NOTHING
    `);

    // Step 3: Update created_by_id from "users" table
    await queryRunner.query(`
        UPDATE "feedback"
        SET created_by_id = u.id
        FROM "users" u 
        WHERE created_by_email = u.email AND created_by = u.keycloak_id
    `);

    // Step 4: Alter created_by_id not allowing NULL
    await queryRunner.query(`
        ALTER TABLE "feedback" ALTER COLUMN "created_by_id" SET NOT NULL
    `);

    // Step 5: Drop columns created_by_email, created_by_name, created_by_username, created_by
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by_email"`);
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by_name"`);
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by_username"`);
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by"`);

    // Step 6: Add Foreign Key constraint to User
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    /**
     * Migrate existing "planning_session" data;
     * Plan mentioned in steps below
     */
    // Step 1: Add created_by_id column allow NULL
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "created_by_id" uuid`);

    // Step 2: Insert into "users" from existing "planning_session" table
    await queryRunner.query(`
        INSERT INTO "users" (roles, email, display_name, username, keycloak_id)
        select '{"USER"}' as roles, created_by_email, created_by_name, created_by_username, created_by from "planning_session" 
        ON CONFLICT DO NOTHING
    `);

    // Step 3: Update created_by_id from "users" table
    await queryRunner.query(`
        UPDATE "planning_session"
        SET created_by_id = u.id
        FROM "users" u 
        WHERE created_by_email = u.email AND created_by = u.keycloak_id
    `);

    // Step 4: Alter created_by_id not allowing NULL
    await queryRunner.query(`
        ALTER TABLE "planning_session" ALTER COLUMN "created_by_id" SET NOT NULL
    `);

    // Step 5: Drop columns created_by_email, created_by_name, created_by_username, created_b
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_email"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_username"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_name"`);

    // Step 6: Add Foreign Key constraint to User
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD CONSTRAINT "FK_e79366103e4d2a4eadd2e386936" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // planning session down
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP CONSTRAINT "FK_e79366103e4d2a4eadd2e386936"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_username" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD "created_by_email" character varying(255)`,
    );
    await queryRunner.query(`
        UPDATE "planning_session"
        SET created_by_name = u.display_name, created_by_username = u.username, created_by = u.keycloak_id, created_by_email = u.email
        FROM "users" u
        WHERE created_by_id = u.id
    `);
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_username" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "created_by_id"`);

    // feedback down
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0"`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" ADD "created_by_name" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD "created_by_username" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" ADD "created_by" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "feedback" ADD "created_by_email" character varying(255)`);
    await queryRunner.query(`
          UPDATE "feedback"
          SET created_by_name = u.display_name, created_by_username = u.username, created_by = u.keycloak_id, created_by_email = u.email
          FROM "users" u
          WHERE created_by_id = u.id
    `);
    await queryRunner.query(`ALTER TABLE "feedback" ALTER COLUMN "created_by_name" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feedback" ALTER COLUMN "created_by_username" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" ALTER COLUMN "created_by_email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "created_by_id"`);

    // care_activity_search_term down
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD "created_by_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD "created_by_username" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD "created_by" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD "created_by_email" character varying(255)`,
    );
    await queryRunner.query(`
        UPDATE "care_activity_search_term"
        SET created_by_name = u.display_name, created_by_username = u.username, created_by = u.keycloak_id, created_by_email = u.email
        FROM "users" u 
        WHERE created_by_id = u.id
    `);
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_username" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "care_activity_search_term" DROP COLUMN "created_by_id"`);
  }
}
