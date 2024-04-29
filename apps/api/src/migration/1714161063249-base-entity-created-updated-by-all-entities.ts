import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaseEntityCreatedUpdatedByAllEntities1714161063249 implements MigrationInterface {
  name = 'BaseEntityCreatedUpdatedByAllEntities1714161063249';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /** USERS */
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_37245f5ef28fdaba1695141b59f"`);

    // add updated column
    await queryRunner.query(`ALTER TABLE "users" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updated_by_id" uuid`);

    // update data
    await queryRunner.query(`UPDATE "users" SET "created_by_id" = "invited_by_id"`);
    await queryRunner.query(`UPDATE "users" SET "updated_by_id" = "invited_by_id"`);

    // remove obsolete column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invited_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invited_by_id"`);

    /** USER PREFERENCE */
    await queryRunner.query(`ALTER TABLE "user_preference" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "user_preference" ADD "updated_by_id" uuid`);

    /** FEEDBACK */
    await queryRunner.query(`ALTER TABLE "feedback" ADD "updated_by_id" uuid`);
    await queryRunner.query(`UPDATE "feedback" SET "updated_by_id" = "created_by_id"`);

    /** UNIT */
    await queryRunner.query(`ALTER TABLE "unit" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "unit" ADD "updated_by_id" uuid`);

    /** OCCUPATION */
    await queryRunner.query(`ALTER TABLE "occupation" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "occupation" ADD "updated_by_id" uuid`);

    /** ALLOWED ACTIVITY */
    await queryRunner.query(`ALTER TABLE "allowed_activity" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "allowed_activity" ADD "updated_by_id" uuid`);

    /** BUNDLE */
    await queryRunner.query(`ALTER TABLE "bundle" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "bundle" ADD "updated_by_id" uuid`);

    /** CARE ACTIVITY */
    await queryRunner.query(`ALTER TABLE "care_activity" ADD "created_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "care_activity" ADD "updated_by_id" uuid`);

    /** PLANNING SESSIONS */
    await queryRunner.query(`ALTER TABLE "planning_session" ADD "updated_by_id" uuid`);
    await queryRunner.query(`UPDATE "planning_session" SET "updated_by_id" = "created_by_id"`);

    /** CARE ACTIVITY SEARCH TERM */
    await queryRunner.query(`ALTER TABLE "care_activity_search_term" ADD "updated_by_id" uuid`);
    await queryRunner.query(
      `UPDATE "care_activity_search_term" SET "updated_by_id" = "created_by_id"`,
    );

    /** CONTRAINTS AND NOT NULL */
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0"`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" ALTER COLUMN "created_by_id" DROP NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP CONSTRAINT "FK_e79366103e4d2a4eadd2e386936"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user_preference" ADD CONSTRAINT "FK_a864073587193337419091c1047" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference" ADD CONSTRAINT "FK_962b7a778dc227127ab1908a688" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_80e310e761f458f272c20ea6add" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_7512547e6226833a6a4bc8ad54a" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_5829098e4b721db3595f96cbfbc" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_9c7ed54e5b0e6889a73ebe176cb" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation" ADD CONSTRAINT "FK_65e0e9e1ae6a5c9dd881bd358d9" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation" ADD CONSTRAINT "FK_d2d0991ebb3f3836b62452fb59a" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_42512dbe8e9ce116bb9d76af863" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" ADD CONSTRAINT "FK_bfe3204fb85c5fa5b4ca5a72321" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle" ADD CONSTRAINT "FK_db92d8ec7d37487276fc128441e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle" ADD CONSTRAINT "FK_6d591fddccbdf3e6a2f2ffd03d3" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity" ADD CONSTRAINT "FK_47d3dc038a4e27a8acee4cbc48f" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity" ADD CONSTRAINT "FK_900d99a8dda9b07d3e7c216360e" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD CONSTRAINT "FK_e79366103e4d2a4eadd2e386936" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD CONSTRAINT "FK_5d0cbff0fd29fc015106cb4719a" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD CONSTRAINT "FK_ea785e774f9e4b8e8fbf8be327c" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP CONSTRAINT "FK_ea785e774f9e4b8e8fbf8be327c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" DROP CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP CONSTRAINT "FK_5d0cbff0fd29fc015106cb4719a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" DROP CONSTRAINT "FK_e79366103e4d2a4eadd2e386936"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity" DROP CONSTRAINT "FK_900d99a8dda9b07d3e7c216360e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity" DROP CONSTRAINT "FK_47d3dc038a4e27a8acee4cbc48f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle" DROP CONSTRAINT "FK_6d591fddccbdf3e6a2f2ffd03d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bundle" DROP CONSTRAINT "FK_db92d8ec7d37487276fc128441e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_bfe3204fb85c5fa5b4ca5a72321"`,
    );
    await queryRunner.query(
      `ALTER TABLE "allowed_activity" DROP CONSTRAINT "FK_42512dbe8e9ce116bb9d76af863"`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation" DROP CONSTRAINT "FK_d2d0991ebb3f3836b62452fb59a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "occupation" DROP CONSTRAINT "FK_65e0e9e1ae6a5c9dd881bd358d9"`,
    );
    await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_9c7ed54e5b0e6889a73ebe176cb"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_5829098e4b721db3595f96cbfbc"`);
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_7512547e6226833a6a4bc8ad54a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_80e310e761f458f272c20ea6add"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`);
    await queryRunner.query(
      `ALTER TABLE "user_preference" DROP CONSTRAINT "FK_962b7a778dc227127ab1908a688"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preference" DROP CONSTRAINT "FK_a864073587193337419091c1047"`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ALTER COLUMN "created_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "care_activity_search_term" ADD CONSTRAINT "FK_ca8e87c5af25e9f2301ed38489e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ALTER COLUMN "created_by_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "planning_session" ADD CONSTRAINT "FK_e79366103e4d2a4eadd2e386936" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "feedback" ALTER COLUMN "created_by_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_893fb77faae46fd1da19f8e6ed0" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "care_activity_search_term" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "planning_session" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "care_activity" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "care_activity" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "bundle" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "bundle" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "allowed_activity" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "allowed_activity" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "user_preference" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "user_preference" DROP COLUMN "created_by_id"`);

    await queryRunner.query(`ALTER TABLE "users" ADD "invited_by_id" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD "invited_at" TIMESTAMP`);

    await queryRunner.query(`UPDATE "users" SET "invited_by_id" = "created_by_id"`);
    await queryRunner.query(`UPDATE "users" SET "invited_at" = "created_at"`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by_id"`);

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_37245f5ef28fdaba1695141b59f" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
