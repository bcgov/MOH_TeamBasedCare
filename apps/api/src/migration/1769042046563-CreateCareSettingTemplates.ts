import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateCareSettingTemplates1769042046563 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_setting_template table
    await queryRunner.createTable(
      new Table({
        name: 'care_setting_template',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'is_master',
            type: 'boolean',
            default: false,
          },
          {
            name: 'unit_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'created_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by_id',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys to care_setting_template
    await queryRunner.createForeignKey(
      'care_setting_template',
      new TableForeignKey({
        columnNames: ['unit_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'unit',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_setting_template',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template',
      new TableForeignKey({
        columnNames: ['created_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template',
      new TableForeignKey({
        columnNames: ['updated_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create junction table for template <-> bundles
    await queryRunner.createTable(
      new Table({
        name: 'care_setting_template_bundles',
        columns: [
          {
            name: 'care_setting_template_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'bundle_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'care_setting_template_bundles',
      new TableForeignKey({
        columnNames: ['care_setting_template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_setting_template',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template_bundles',
      new TableForeignKey({
        columnNames: ['bundle_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bundle',
        onDelete: 'CASCADE',
      }),
    );

    // Create junction table for template <-> activities
    await queryRunner.createTable(
      new Table({
        name: 'care_setting_template_activities',
        columns: [
          {
            name: 'care_setting_template_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'care_activity_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'care_setting_template_activities',
      new TableForeignKey({
        columnNames: ['care_setting_template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_setting_template',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template_activities',
      new TableForeignKey({
        columnNames: ['care_activity_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_activity',
        onDelete: 'CASCADE',
      }),
    );

    // Create care_setting_template_permission table
    await queryRunner.createTable(
      new Table({
        name: 'care_setting_template_permission',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'permission',
            type: 'enum',
            enum: ['Y', 'LC'],
            isNullable: false,
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'care_activity_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'occupation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add unique constraint for template + activity + occupation
    await queryRunner.createUniqueConstraint(
      'care_setting_template_permission',
      new TableUnique({
        name: 'template_activity_occupation',
        columnNames: ['template_id', 'care_activity_id', 'occupation_id'],
      }),
    );

    // Add foreign keys to care_setting_template_permission
    await queryRunner.createForeignKey(
      'care_setting_template_permission',
      new TableForeignKey({
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_setting_template',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template_permission',
      new TableForeignKey({
        columnNames: ['care_activity_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_activity',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'care_setting_template_permission',
      new TableForeignKey({
        columnNames: ['occupation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'occupation',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'care_setting_template',
      new TableIndex({ name: 'idx_care_setting_template_unit_id', columnNames: ['unit_id'] }),
    );
    await queryRunner.createIndex(
      'care_setting_template',
      new TableIndex({ name: 'idx_care_setting_template_parent_id', columnNames: ['parent_id'] }),
    );
    await queryRunner.createIndex(
      'care_setting_template',
      new TableIndex({ name: 'idx_care_setting_template_is_master', columnNames: ['is_master'] }),
    );
    await queryRunner.createIndex(
      'care_setting_template_permission',
      new TableIndex({ name: 'idx_care_setting_template_permission_template_id', columnNames: ['template_id'] }),
    );

    // Seed master templates for existing units
    await this.seedMasterTemplates(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (permissions first due to foreign keys)
    await queryRunner.dropTable('care_setting_template_permission', true, true, true);
    await queryRunner.dropTable('care_setting_template_activities', true, true, true);
    await queryRunner.dropTable('care_setting_template_bundles', true, true, true);
    await queryRunner.dropTable('care_setting_template', true, true, true);
  }

  private async seedMasterTemplates(queryRunner: QueryRunner): Promise<void> {
    // Get all existing units
    const units = await queryRunner.query(`SELECT id, display_name FROM unit`);

    for (const unit of units) {
      // Create master template for each unit (using parameterized query to prevent SQL injection)
      await queryRunner.query(
        `INSERT INTO care_setting_template (name, is_master, unit_id) VALUES ($1, true, $2)`,
        [`${unit.display_name} - Master`, unit.id],
      );

      // Get the newly created template
      const templates = await queryRunner.query(
        `SELECT id FROM care_setting_template WHERE unit_id = $1 AND is_master = true`,
        [unit.id],
      );
      const templateId = templates[0]?.id;

      if (!templateId) continue;

      // Get all bundles that have activities for this unit
      const bundles = await queryRunner.query(
        `SELECT DISTINCT b.id
        FROM bundle b
        INNER JOIN care_activity ca ON ca.bundle_id = b.id
        INNER JOIN care_activity_care_locations_unit cacu ON cacu.care_activity_id = ca.id
        WHERE cacu.unit_id = $1`,
        [unit.id],
      );

      // Add bundles to template
      for (const bundle of bundles) {
        await queryRunner.query(
          `INSERT INTO care_setting_template_bundles (care_setting_template_id, bundle_id) VALUES ($1, $2)`,
          [templateId, bundle.id],
        );
      }

      // Get all activities for this unit
      const activities = await queryRunner.query(
        `SELECT DISTINCT ca.id
        FROM care_activity ca
        INNER JOIN care_activity_care_locations_unit cacu ON cacu.care_activity_id = ca.id
        WHERE cacu.unit_id = $1`,
        [unit.id],
      );

      // Add activities to template
      for (const activity of activities) {
        await queryRunner.query(
          `INSERT INTO care_setting_template_activities (care_setting_template_id, care_activity_id) VALUES ($1, $2)`,
          [templateId, activity.id],
        );
      }

      // Copy existing allowed_activity permissions to template permissions
      const allowedActivities = await queryRunner.query(
        `SELECT aa.permission, aa.care_activity_id, aa.occupation_id
        FROM allowed_activity aa
        WHERE aa.unit_id = $1`,
        [unit.id],
      );

      for (const aa of allowedActivities) {
        await queryRunner.query(
          `INSERT INTO care_setting_template_permission (permission, template_id, care_activity_id, occupation_id) VALUES ($1, $2, $3, $4)`,
          [aa.permission, templateId, aa.care_activity_id, aa.occupation_id],
        );
      }
    }
  }
}
