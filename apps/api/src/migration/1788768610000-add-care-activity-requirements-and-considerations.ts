import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareActivityRequirementsAndConsiderations1788768610000
  implements MigrationInterface
{
  name = 'AddCareActivityRequirementsAndConsiderations1788768610000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_activity" ADD "requirements_and_considerations" character varying(3000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "care_activity" DROP COLUMN "requirements_and_considerations"`,
    );
  }
}
