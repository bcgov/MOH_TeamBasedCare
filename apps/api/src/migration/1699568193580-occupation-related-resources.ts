import { MigrationInterface, QueryRunner } from 'typeorm';

export class occupationRelatedResources1699568193580 implements MigrationInterface {
  name = 'occupationRelatedResources1699568193580';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" ADD "related_resources" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "occupation" DROP COLUMN "related_resources"`);
  }
}
