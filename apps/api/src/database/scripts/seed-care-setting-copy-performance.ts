/**
 * Local-only dense fixture for reproducing slow care-setting copies.
 *
 * Targets exactly one master named "Acute care medicine - Master". For every
 * selected activity and non-deleted occupation, apply inserts a missing
 * permission as Y. Existing Y, LC, and N rows, LC details, template metadata,
 * and selections are preserved. These synthetic permissions must never be
 * seeded into dev, test, or production.
 *
 * Prerequisites:
 * - The local tbcm_db PostgreSQL 15 container is running with its port published.
 * - The database already has the application schema, named master, selected
 *   activities, and occupations; this script does not migrate or import them.
 * - Root .env supplies connection credentials. Explicit environment variables
 *   take precedence. NODE_ENV must be local and POSTGRES_HOST must be loopback;
 *   copy-performance-local.ts also verifies the actual Docker/database identity.
 *
 * Usage from the repository root:
 *
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:fixture dry-run
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:fixture apply
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:fixture cleanup
 *
 * dry-run prints the target and matrix counts without changing database rows;
 * it writes a local preview signature. Review that output before apply, which
 * requires a matching preview. Repeating dry-run/apply on a complete fixture
 * adds no rows. Run benchmarks between apply and cleanup.
 *
 * apply writes in batches inside one transaction, verifies complete matrix
 * coverage (including preserved N cells), and journals inserted IDs/hashes
 * before commit. Artifacts live in the ignored .build/copy-performance directory:
 * preview.json records the reviewed target/counts; ownership.json records only
 * rows owned by these diagnostics.
 *
 * cleanup removes owned, unchanged fixture rows and benchmark copies, not all
 * permissions on the master. Changed rows or unexpected dependents cause refusal.
 * Preserve ownership.json after any failure, especially a pending HTTP outcome;
 * reconcile the records rather than deleting the manifest to bypass safeguards.
 * See docs/runbooks.md, "Local Care-Setting Copy Performance", for the full workflow.
 */
import {
  cleanupOwned,
  connectLocal,
  failSafely,
  fingerprint,
  LocalDiagnosticError,
  MANIFEST,
  PREVIEW,
  readPreview,
  report,
  writeJson,
} from './copy-performance-local';

/**
 * Execute one explicit fixture action; importing this module does not seed data.
 * All actions use the guarded local context and release it in finally. Apply
 * inserts only missing selected-activity/active-occupation pairs as Y, preserving
 * existing Y, LC, N, and historical rows outside that matrix.
 *
 * @param action - `dry-run` reports counts and writes a local preview signature
 * without changing database rows; `apply` requires a matching preview and journals
 * inserted rows before committing; `cleanup` removes only unchanged journal-owned
 * fixture rows and copies. No action is selected implicitly.
 * @returns Resolves without a value after the action, report, and connection close.
 * @throws {LocalDiagnosticError} If the action, local target, source data, preview,
 * matrix coverage, or cleanup ownership checks are invalid.
 * @throws Propagates database/filesystem failures. An active transaction is rolled
 * back; the CLI handles rejection with failSafely rather than printing raw errors.
 */
export async function seed(action: string): Promise<void> {
  if (!['dry-run', 'apply', 'cleanup'].includes(action)) {
    throw new LocalDiagnosticError('Use dry-run, apply, or cleanup explicitly.');
  }
  const context = await connectLocal();
  const { runner, source, ownership } = context;
  try {
    if (action === 'cleanup') {
      await cleanupOwned(context, true);
      report({ action, identity: context.identity, source, remainingOwnedPermissions: 0 });
      return;
    }
    await runner.startTransaction('REPEATABLE READ');
    // Activities are hard-deleted; only occupations have a deleted_at visibility filter.
    const [counts] = await runner.query(
      `WITH activities AS (
         SELECT a.id FROM care_activity a JOIN care_setting_template_activities s ON s.care_activity_id = a.id
         WHERE s.care_setting_template_id = $1
       ), occupations AS (SELECT id FROM occupation WHERE deleted_at IS NULL)
       SELECT (SELECT count(*)::int FROM activities) AS activities,
         (SELECT count(*)::int FROM occupations) AS occupations,
         (SELECT count(*)::int FROM care_setting_template_bundles WHERE care_setting_template_id = $1) AS bundles,
         (SELECT count(*)::int FROM care_setting_template_permission WHERE template_id = $1) AS stored,
         (SELECT count(*)::int FROM care_setting_template_permission p
           JOIN activities a ON a.id = p.care_activity_id JOIN occupations o ON o.id = p.occupation_id
           WHERE template_id = $1) AS covered,
         (SELECT count(*)::int FROM care_setting_template_permission WHERE template_id = $1 AND permission = 'LC') AS lc`,
      [source.id],
    );
    if (!counts.activities || !counts.occupations)
      throw new LocalDiagnosticError('Master has insufficient visible base data.');
    const expected = counts.activities * counts.occupations;
    const signature = fingerprint({ identity: context.identity, source, counts });
    report({
      action,
      identity: context.identity,
      source,
      ...counts,
      expected,
      missing: expected - counts.covered,
      historicalOutsideMatrix: counts.stored - counts.covered,
    });
    if (action === 'dry-run') {
      await runner.rollbackTransaction();
      writeJson(PREVIEW, { signature });
      return;
    }
    if (readPreview() !== signature) {
      throw new LocalDiagnosticError(
        'Run dry-run and review the current database/template/counts before apply.',
      );
    }
    let inserted = 0;
    while (true) {
      const rows: { id: string; row: unknown }[] = await runner.query(
        `INSERT INTO care_setting_template_permission (template_id, care_activity_id, occupation_id, permission)
         SELECT $1, a.id, o.id, 'Y'
         FROM care_activity a
         JOIN care_setting_template_activities s ON s.care_activity_id = a.id AND s.care_setting_template_id = $1
         CROSS JOIN occupation o
         WHERE o.deleted_at IS NULL AND NOT EXISTS (
           SELECT 1 FROM care_setting_template_permission p
           WHERE p.template_id = $1 AND p.care_activity_id = a.id AND p.occupation_id = o.id
         )
         LIMIT 5000
         RETURNING id, to_jsonb(care_setting_template_permission) AS row`,
        [source.id],
      );
      ownership.permissions.push(
        ...rows.map(row => ({ id: row.id, fingerprint: fingerprint(row.row) })),
      );
      inserted += rows.length;
      if (rows.length < 5000) break;
    }
    const [coverage] = await runner.query(
      `SELECT count(*)::int AS count FROM care_setting_template_permission p
       JOIN care_activity a ON a.id = p.care_activity_id
       JOIN occupation o ON o.id = p.occupation_id AND o.deleted_at IS NULL
       JOIN care_setting_template_activities s ON s.care_activity_id = a.id AND s.care_setting_template_id = p.template_id
       WHERE p.template_id = $1`,
      [source.id],
    );
    if (coverage.count !== expected)
      throw new LocalDiagnosticError('Dense matrix coverage verification failed.');
    // Journal durable ownership before COMMIT. Rolled-back IDs are harmless on cleanup.
    writeJson(MANIFEST, ownership);
    await runner.commitTransaction();
    report({ inserted, coverage: coverage.count, owned: ownership.permissions.length });
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await context.close();
  }
}

if (require.main === module) seed(process.argv[2]).catch(failSafely);
