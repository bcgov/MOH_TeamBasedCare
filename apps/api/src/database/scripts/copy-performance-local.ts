/**
 * Shared safety, connection, and ownership support for copy-performance scripts.
 *
 * This is a library, not a standalone CLI. Use the package commands
 * db:copy-performance:fixture and db:copy-performance:benchmark; their entry files
 * document complete examples. Neither importing this module nor constructing
 * its exported paths connects to a database or creates a fixture.
 *
 * Callers must explicitly set NODE_ENV=local and a loopback POSTGRES_HOST.
 * connectLocal loads remaining credentials from the repository root .env,
 * requires a local Unix-socket Docker daemon and running tbcm_db PostgreSQL 15
 * container, and verifies the published port, server address, and cluster ID.
 * Environment labels or localhost alone do not prove a connection is local.
 * The connection disables migrations, synchronization, subscribers, and SQL logs.
 *
 * The named master must already exist. A session-level advisory lock serializes
 * diagnostics using the shared journal. Always await context.close() in finally
 * to release the dedicated runner, connections, and their session locks.
 *
 * Local artifacts, under the ignored .build/copy-performance directory:
 * - preview.json: reviewed database/master/count signature required by seed apply.
 * - ownership.json: database/source identity plus exact owned row IDs and hashes.
 *   It is a cleanup journal, not permission payload storage or a database backup.
 * - LABEL.json: benchmark reports written by the benchmark entry point.
 *
 * Writers journal ownership durably before committing fixture/service-copy
 * writes. Cleanup compares full persisted fingerprints under locks and refuses
 * to delete changed rows or rows with unexpected dependents. It never removes
 * records simply because their names look like benchmark names.
 *
 * HTTP calls also journal a pending request before POST because a failed response
 * does not establish whether the server committed. An unresolved pending entry
 * blocks subsequent diagnostic connections until manually reconciled. Preserve
 * the journal after failures; deleting it loses ownership information and is not
 * a safe workaround. Entry points use failSafely for redacted, nonzero failures.
 *
 * See docs/runbooks.md, "Local Care-Setting Copy Performance", for setup, execution,
 * report interpretation, and explicit cleanup commands.
 */
import 'reflect-metadata';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { DataSource, QueryRunner } from 'typeorm';
import { DatabaseNamingStrategy } from '../database.naming-strategy';

export const MASTER_NAME = 'Acute care medicine - Master';
export const ROOT = resolve(__dirname, '../../../../..');
export const ARTIFACTS = join(ROOT, '.build/copy-performance');
export const MANIFEST = join(ARTIFACTS, 'ownership.json');
export const PREVIEW = join(ARTIFACTS, 'preview.json');

export class LocalDiagnosticError extends Error {}

export interface OwnedRow {
  id: string;
  fingerprint: string;
}

export interface Ownership {
  format: 1;
  cluster: string;
  database: string;
  sourceId: string;
  permissions: OwnedRow[];
  templates: OwnedRow[];
  pendingHttp?: { name: string; healthAuthority: string; requestHash: string };
}

/**
 * Reject unsafe connection settings before Docker inspection or database access.
 * This is only an environment preflight: connectLocal must still prove the actual
 * server identity, since a loopback address alone does not rule out a tunnel.
 *
 * @param environment - Environment settings to inspect without mutation. Requires
 * NODE_ENV=local, an explicit loopback POSTGRES_HOST, and no alternate routing
 * through DATABASE_URL, PGHOSTADDR, or PGSERVICE.
 * @returns Nothing when the environment passes the preflight.
 * @throws {LocalDiagnosticError} If any required local-only condition is unmet.
 */
export function assertLocalTarget(environment: NodeJS.ProcessEnv): void {
  if (environment.NODE_ENV !== 'local') throw new LocalDiagnosticError('Require NODE_ENV=local.');
  if (!['127.0.0.1', 'localhost', '::1'].includes(environment.POSTGRES_HOST ?? '')) {
    throw new LocalDiagnosticError(
      'Require an explicit loopback POSTGRES_HOST; remote/tunnel targets refused.',
    );
  }
  if (environment.DATABASE_URL || environment.PGHOSTADDR || environment.PGSERVICE) {
    throw new LocalDiagnosticError('Alternate PostgreSQL connection routing is not supported.');
  }
}

/**
 * Persist a report/journal through a sibling pending file, fsync, and atomic rename.
 * Newly created artifact directories/files use private permissions. Callers must
 * let failures abort their operation rather than commit untracked database rows.
 *
 * @param path - Destination filename, absolute or relative to the process working
 * directory. Parent directories are created and an existing destination is replaced.
 * @param data - JSON-serializable, non-undefined value. Use ownership metadata or
 * aggregates rather than credentials or complete clinical permission payloads.
 * @returns Nothing after the file and containing directory have been synchronized.
 * @throws {TypeError} If JSON serialization fails, for example on circular values.
 * @throws Propagates filesystem failures. A pending file or an already-renamed
 * destination may remain; callers must not assume the previous file is unchanged.
 */
export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const pending = `${path}.pending`;
  const fd = openSync(pending, 'w', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(data, null, 2) + '\n');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(pending, path);
  const directory = openSync(dirname(path), 'r');
  try {
    fsyncSync(directory);
  } finally {
    closeSync(directory);
  }
}

/**
 * Hash JSON content for dataset comparisons and ownership change detection.
 * This is not canonical JSON: callers must keep object property order and array
 * ordering stable when equivalent data should produce the same fingerprint.
 *
 * @param value - Value whose JSON serialization is to be hashed.
 * @returns The lowercase, 64-character hexadecimal SHA-256 digest of that JSON.
 * @throws {TypeError} If the value cannot produce JSON text, including circular
 * references, BigInt values, and an undefined root value.
 */
export function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Read the signature produced by the fixture's most recent dry-run.
 * Reading does not validate freshness or database identity; seed compares the
 * signature against a newly calculated one before allowing apply.
 *
 * @returns The stored signature, or undefined if the preview file or signature
 * property is absent. The expected preview format is written by seed.
 * @throws {SyntaxError} If the preview is not valid JSON.
 * @throws Propagates filesystem and malformed-preview access errors rather than
 * treating an unreadable or corrupt preview as a successful dry-run.
 */
export function readPreview(): string | undefined {
  return existsSync(PREVIEW) ? JSON.parse(readFileSync(PREVIEW, 'utf8')).signature : undefined;
}

/**
 * Write a human-readable JSON progress/result record to standard output.
 * This is console reporting, not durable artifact persistence; use writeJson for
 * reports that must survive process exit.
 *
 * @param value - JSON-serializable, non-sensitive aggregate data. The function
 * performs no redaction, so callers must exclude tokens, payloads, and restrictions.
 * @returns Nothing after handing the formatted record and newline to stdout;
 * it does not wait for the output stream to drain.
 * @throws {TypeError} If JSON serialization fails.
 */
export function report(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

/**
 * Verify the actual local database, resolve the single target master, and load
 * its compatible ownership journal while holding the diagnostic advisory lock.
 * Does not seed or migrate data. The returned context must be closed in finally,
 * including when a later dry-run, benchmark, or cleanup operation fails.
 *
 * Loads the root .env without overriding explicitly supplied environment values.
 * Requires a local Unix-socket Docker daemon and the running tbcm_db PostgreSQL 15
 * container; compares its cluster identity and network address with the connection.
 *
 * @returns An initialized DataSource, connected advisory-lock-owning QueryRunner,
 * source master, mutable ownership journal, non-secret identity, and close method.
 * No transaction is started for the caller. Use `await context.close()` in finally
 * after completing or rolling back any transaction.
 * @throws {LocalDiagnosticError} If the target, master, or journal is incompatible,
 * or an unresolved pending HTTP request requires manual reconciliation.
 * @throws Propagates Docker, connection, query, and manifest-read failures.
 * Resources acquired during failed connection setup are released before rejection.
 */
export async function connectLocal() {
  dotenv.config({ path: join(ROOT, '.env') });
  assertLocalTarget(process.env);
  const dockerEndpoint = execFileSync(
    'docker',
    ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
  if (
    !dockerEndpoint.startsWith('unix:///') ||
    (process.env.DOCKER_HOST && !process.env.DOCKER_HOST.startsWith('unix:///'))
  ) {
    throw new LocalDiagnosticError(
      'Require a local Unix-socket Docker daemon; remote Docker contexts/tunnels are refused.',
    );
  }
  const inspect: {
    running: boolean;
    image: string;
    ports: Record<string, { HostPort: string }[]>;
    networks: Record<string, { IPAddress: string; GlobalIPv6Address: string }>;
  } = JSON.parse(
    execFileSync(
      'docker',
      [
        'inspect',
        'tbcm_db',
        '--format',
        '{"running":{{json .State.Running}},"image":{{json .Config.Image}},"ports":{{json .NetworkSettings.Ports}},"networks":{{json .NetworkSettings.Networks}}}',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ),
  );
  if (!inspect.running || !/^postgres:15(?:-|$)/.test(inspect.image)) {
    throw new LocalDiagnosticError('Require the running local tbcm_db PostgreSQL 15 container.');
  }
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const bindings = inspect.ports['5432/tcp'] ?? [];
  if (!bindings.some((binding: { HostPort: string }) => Number(binding.HostPort) === port)) {
    throw new LocalDiagnosticError('Target port is not published directly by tbcm_db.');
  }
  /**
   * Execute an identity-inspection command inside the inspected local container.
   *
   * @param args - Executable and separate arguments for `docker exec tbcm_db`.
   * No shell command string is evaluated.
   * @returns Trimmed UTF-8 standard output; stderr is captured, not printed.
   * @throws Propagates process-launch and nonzero-exit errors to the CLI handler.
   */
  const docker = (args: string[]) =>
    execFileSync('docker', ['exec', 'tbcm_db', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const control = docker(['pg_controldata', docker(['printenv', 'PGDATA'])]);
  const cluster = control.match(/Database system identifier:\s+(\d+)/)?.[1];
  if (!cluster)
    throw new LocalDiagnosticError('Cannot verify the Docker PostgreSQL cluster identity.');
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port,
    username: process.env.POSTGRES_USERNAME || 'freshworks',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE || 'tbcm',
    entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
    namingStrategy: new DatabaseNamingStrategy(),
    synchronize: false,
    migrationsRun: false,
    subscribers: [],
    logging: false,
    extra: { connectionTimeoutMillis: 5000, statement_timeout: 120000 },
  });
  let runner: QueryRunner | undefined;
  try {
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.connect();
    const [identity] = await runner.query(
      `SELECT system_identifier::text AS cluster, current_database() AS database,
              host(inet_server_addr()) AS address, inet_server_port() AS port
       FROM pg_control_system()`,
    );
    const addresses = Object.values(inspect.networks).flatMap(
      (network: { IPAddress: string; GlobalIPv6Address: string }) =>
        [network.IPAddress, network.GlobalIPv6Address].filter(Boolean),
    );
    if (
      identity.cluster !== cluster ||
      identity.port !== 5432 ||
      !addresses.includes(identity.address)
    ) {
      throw new LocalDiagnosticError(
        'Connected server is not the verified local Docker database; refusing.',
      );
    }
    await runner.query(`SELECT pg_advisory_lock(734120, 91823)`);
    const sources = await runner.query(
      `SELECT id, name, is_master, unit_id, level FROM care_setting_template WHERE name = $1`,
      [MASTER_NAME],
    );
    if (sources.length !== 1 || !sources[0].is_master) {
      throw new LocalDiagnosticError(
        'Require exactly one master named Acute care medicine - Master.',
      );
    }
    const source = sources[0] as {
      id: string;
      name: string;
      is_master: boolean;
      unit_id: string;
      level: string | null;
    };
    const ownership: Ownership = existsSync(MANIFEST)
      ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
      : {
          format: 1,
          cluster,
          database: identity.database,
          sourceId: source.id,
          permissions: [],
          templates: [],
        };
    if (
      ownership.format !== 1 ||
      ownership.cluster !== cluster ||
      ownership.database !== identity.database ||
      ownership.sourceId !== source.id
    ) {
      throw new LocalDiagnosticError(
        'Ownership manifest belongs to a different database or master.',
      );
    }
    if (ownership.pendingHttp) {
      throw new LocalDiagnosticError(
        'An interrupted HTTP request needs manual reconciliation against ownership.json before further writes. Do not discard the manifest.',
      );
    }
    return {
      dataSource,
      runner,
      source,
      ownership,
      identity: {
        host: process.env.POSTGRES_HOST,
        port,
        database: identity.database,
        cluster,
        container: 'tbcm_db',
      },
      /**
       * Release the diagnostic runner and destroy the DataSource's connection pool.
       *
       * @returns Resolves after resource teardown, which releases the session's
       * advisory lock. Call once in finally, after finishing active transactions.
       * @throws Propagates runner-release or connection-pool shutdown failures.
       */
      close: async () => {
        await runner!.release();
        await dataSource.destroy();
      },
    };
  } catch (error) {
    if (runner) await runner.release();
    if (dataSource.isInitialized) await dataSource.destroy();
    throw error;
  }
}

export type LocalContext = Awaited<ReturnType<typeof connectLocal>>;

/**
 * Refuse cleanup when owned rows are referenced outside the expected cascade set.
 * Foreign keys are discovered from PostgreSQL's catalogue rather than assuming
 * the schema has no newer dependent tables.
 *
 * @param runner - Runner in the cleanup transaction, with the relevant content
 * locks held through deletion so new dependents cannot race this check.
 * @param target - Referenced table name to resolve as a PostgreSQL regclass.
 * @param ids - Owned row UUIDs being considered for deletion; empty input is a no-op.
 * @param allowedTables - Referencing table names whose dependents are handled by
 * the caller's known cleanup/cascade behavior.
 * @returns Resolves without a value if no unexpected dependent rows are found.
 * @throws {LocalDiagnosticError} If an unexpected dependent exists or an unallowed
 * composite foreign key cannot be safely checked by this single-column routine.
 * @throws Propagates catalogue and dependent-row query failures.
 */
async function assertNoUnexpectedDependents(
  runner: QueryRunner,
  target: string,
  ids: string[],
  allowedTables: string[],
): Promise<void> {
  if (!ids.length) return;
  const references = await runner.query(
    `SELECT c.conrelid::regclass::text AS "table", a.attname AS "column", cardinality(c.conkey) AS columns
     FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
     WHERE c.contype = 'f' AND c.confrelid = $1::regclass`,
    [target],
  );
  for (const reference of references) {
    if (allowedTables.includes(reference.table)) continue;
    if (reference.columns !== 1)
      throw new LocalDiagnosticError('Cleanup refuses an unexpected composite foreign key.');
    const table = reference.table
      .split('.')
      .map((part: string) => `"${part.replace(/"/g, '""')}"`)
      .join('.');
    const column = `"${reference.column.replace(/"/g, '""')}"`;
    const rows = await runner.query(
      `SELECT 1 FROM ${table} WHERE ${column} = ANY($1::uuid[]) LIMIT 1`,
      [ids],
    );
    if (rows.length)
      throw new LocalDiagnosticError('Owned records have unexpected dependents; cleanup refused.');
  }
}

/**
 * Hold content-table locks until the caller's active transaction ends.
 * Child tables are included because some permission writers do not lock the
 * parent row; a parent-only lock would leave validation/fingerprinting races.
 * These coarse locks are intended only for the guarded local diagnostic workflow.
 *
 * @param runner - Connected runner with an active transaction. Acquires SHARE ROW
 * EXCLUSIVE locks on the template, permission, and both selection join tables.
 * @returns Resolves once all locks are granted; commit or rollback releases them.
 * @throws Propagates lock timeout, deadlock, missing-transaction, and database errors.
 */
export async function lockTemplateContent(runner: QueryRunner): Promise<void> {
  await runner.query(`LOCK TABLE care_setting_template, care_setting_template_permission,
      care_setting_template_bundles, care_setting_template_activities IN SHARE ROW EXCLUSIVE MODE`);
}

/**
 * Hash the full template row and ordered permission/bundle/activity rows, including
 * persisted IDs and timestamps. This detects edits beyond logical permission
 * values. Returns null for an absent template; acquire content locks separately
 * when the fingerprint must correspond to an earlier validation in the same snapshot.
 *
 * @param runner - Connected runner used for the single aggregate read. Use the
 * validation transaction's runner when capturing cleanup ownership.
 * @param id - Exact template UUID, never a name-based ownership search.
 * @returns SHA-256 fingerprint of the template and its ordered child rows, or null
 * if that template does not exist. Does not modify rows or the ownership journal.
 * @throws Propagates database and JSON fingerprinting failures.
 */
export async function templateFingerprint(runner: QueryRunner, id: string): Promise<string | null> {
  const [row] = await runner.query(
    `SELECT to_jsonb(t) AS template,
       (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.id), '[]') FROM care_setting_template_permission p WHERE p.template_id = t.id) AS permissions,
       (SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.bundle_id), '[]') FROM care_setting_template_bundles b WHERE b.care_setting_template_id = t.id) AS bundles,
       (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.care_activity_id), '[]') FROM care_setting_template_activities a WHERE a.care_setting_template_id = t.id) AS activities
     FROM care_setting_template t WHERE t.id = $1`,
    [id],
  );
  return row ? fingerprint(row) : null;
}

/**
 * Delete only journal-owned, unchanged records in one guarded transaction.
 * Missing owned rows are harmless on retry; changed hashes or unexpected
 * dependents abort deletion. Journal entries are cleared only after DB commit.
 *
 * @param context - Verified local connection and its matching ownership journal.
 * Its runner must not already have an active transaction.
 * @param includeFixture - Also remove all owned seed rows, independently of the
 * templateIds filter; false leaves the dense fixture.
 * @param templateIds - Restrict template cleanup to these owned IDs, e.g. one HTTP
 * probe. Omit to process all owned benchmark copies. Unowned IDs are never adopted.
 * @returns Resolves after selected deletions commit and the updated journal is
 * written. The context remains open for subsequent diagnostic work.
 * @throws {LocalDiagnosticError} If an owned row changed or has unexpected dependents.
 * @throws Propagates database/filesystem failures, rolling back any still-active
 * transaction. If journal writing fails after commit, keep the existing manifest:
 * its now-absent owned IDs are safe to process again on a later cleanup.
 */
export async function cleanupOwned(
  context: LocalContext,
  includeFixture: boolean,
  templateIds?: readonly string[],
): Promise<void> {
  const { runner, ownership } = context;
  const templates = templateIds
    ? ownership.templates.filter(row => templateIds.includes(row.id))
    : ownership.templates;
  await runner.startTransaction();
  try {
    // Locks prevent edits/dependent inserts racing the fingerprint checks.
    await lockTemplateContent(runner);
    await runner.query(
      'SELECT id FROM care_setting_template WHERE id = ANY($1::uuid[]) FOR UPDATE',
      [templates.map(row => row.id)],
    );
    await assertNoUnexpectedDependents(
      runner,
      'care_setting_template',
      templates.map(row => row.id),
      [
        'care_setting_template_permission',
        'care_setting_template_bundles',
        'care_setting_template_activities',
      ],
    );
    for (const owned of templates) {
      const actual = await templateFingerprint(runner, owned.id);
      if (actual === null) continue;
      if (actual !== owned.fingerprint)
        throw new LocalDiagnosticError(`Owned benchmark copy changed: ${owned.id}`);
      const permissions: { id: string }[] = await runner.query(
        'SELECT id FROM care_setting_template_permission WHERE template_id = $1 FOR UPDATE',
        [owned.id],
      );
      await assertNoUnexpectedDependents(
        runner,
        'care_setting_template_permission',
        permissions.map(row => row.id),
        [],
      );
      await runner.query('DELETE FROM care_setting_template WHERE id = $1', [owned.id]);
    }
    if (includeFixture) {
      for (let start = 0; start < ownership.permissions.length; start += 1000) {
        const batch = ownership.permissions.slice(start, start + 1000);
        const rows = await runner.query(
          `SELECT id, to_jsonb(p) AS row FROM care_setting_template_permission p WHERE id = ANY($1::uuid[]) FOR UPDATE`,
          [batch.map(row => row.id)],
        );
        const expected = new Map(batch.map(row => [row.id, row.fingerprint]));
        for (const row of rows) {
          if (fingerprint(row.row) !== expected.get(row.id)) {
            throw new LocalDiagnosticError(`Owned fixture permission changed: ${row.id}`);
          }
        }
        await assertNoUnexpectedDependents(
          runner,
          'care_setting_template_permission',
          batch.map(row => row.id),
          [],
        );
        await runner.query(
          'DELETE FROM care_setting_template_permission WHERE id = ANY($1::uuid[])',
          [batch.map(row => row.id)],
        );
      }
    }
    await runner.commitTransaction();
    const cleanedIds = new Set(templates.map(row => row.id));
    ownership.templates = ownership.templates.filter(row => !cleanedIds.has(row.id));
    if (includeFixture) ownership.permissions = [];
    // A crash before this write retains old IDs; absent rows are safe on retry.
    writeJson(MANIFEST, ownership);
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  }
}

/**
 * CLI rejection handler: report a safe diagnostic message and set a failure exit
 * code. Unexpected driver errors are not printed because they may contain bind
 * values or connection secrets. This does not clean records or clear the journal.
 *
 * @param error - Rejection from a diagnostic entry point. Only LocalDiagnosticError
 * messages are printed verbatim and therefore must already be safe to disclose;
 * all other values produce a generic message without stack traces or SQL details.
 * @returns Nothing after writing to stderr and setting process.exitCode to 1.
 * Does not immediately terminate the process or close database resources; entry
 * points remain responsible for their own finally-based teardown.
 */
export function failSafely(error: unknown): void {
  process.stderr.write(
    error instanceof LocalDiagnosticError
      ? `${error.message}\n`
      : 'Local copy diagnostic failed; no SQL, payload, or credentials logged. Check prerequisites and ownership safety checks.\n',
  );
  process.exitCode = 1;
}
