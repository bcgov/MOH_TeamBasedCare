import { MigrationInterface, QueryRunner } from 'typeorm';

export class inviteUserUpdate1708735657725 implements MigrationInterface {
  name = 'inviteUserUpdate1708735657725';
  initUser = process.env.INIT_USER;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // insert first admin email
    if (this.initUser) {
      await queryRunner.query(
        `INSERT INTO public.users (email, roles) values ('${this.initUser}', '{USER,ADMIN}')`,
      );
      // eslint-disable-next-line no-console
      console.log(
        `Migration :: inviteUserUpdate1708735657725 :: up :: First application user - ${this.initUser} inserted`,
      );
    }

    await queryRunner.query(`ALTER TABLE "users" ADD "invited_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "invited_by_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97b5061278a40c1dead71c1b889" UNIQUE ("keycloak_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_37245f5ef28fdaba1695141b59f" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_37245f5ef28fdaba1695141b59f"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97b5061278a40c1dead71c1b889"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invited_by_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invited_at"`);

    // remove first admin email
    if (this.initUser) {
      await queryRunner.query(`DELETE FROM public.users WHERE email = '${this.initUser}'`);
      // eslint-disable-next-line no-console
      console.log(
        `Migration :: inviteUserUpdate1708735657725 :: down :: First application user - ${this.initUser} removed`,
      );
    }
  }
}
