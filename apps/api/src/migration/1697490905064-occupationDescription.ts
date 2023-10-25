import { MigrationInterface, QueryRunner } from 'typeorm';

export class occupationDescription1697490905064 implements MigrationInterface {
  name = 'occupationDescription1697490905064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" ADD "description" character varying(4096)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "description"`);
  }
}
