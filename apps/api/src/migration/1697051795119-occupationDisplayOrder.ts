import { MigrationInterface, QueryRunner } from 'typeorm';

export class occupationDisplayOrder1697051795119 implements MigrationInterface {
  name = 'occupationDisplayOrder1697051795119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" ADD "display_order" smallint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "display_order"`);
  }
}
