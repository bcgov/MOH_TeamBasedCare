/**
 * Measure care-setting copy performance and verify persisted results locally.
 *
 * By default this calls the real CareSettingTemplateService against the verified
 * local PostgreSQL database, without starting Nest or making HTTP requests.
 * Seed the dense fixture with db:copy-performance:fixture dry-run/apply first.
 * No mode seeds missing cells automatically, runs migrations, or targets dev/prod.
 *
 * CLI shape, from the repository root:
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:benchmark LABEL [WARM_COUNT] [OPTIONS]
 *
 * LABEL is only a report/template-name label, not an implementation switch:
 * "baseline" and "optimized" both execute the current working-tree code.
 * WARM_COUNT defaults to 30. Each scenario has one initial call reported
 * separately, then WARM_COUNT calls used for median and nearest-rank p95.
 *
 * Default scenarios:
 * - Dense: non-N permissions within selected activities x active occupations.
 *   Preserved N rows count toward fixture coverage but are not submitted.
 * - Sparse: the first 20 dense permissions plus all dense LC rows, deduplicated.
 * - Empty: no selected bundles, selected activities, or permissions.
 *
 * Examples:
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:benchmark baseline 30
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:benchmark optimized 30 --rollback
 *   NODE_ENV=local POSTGRES_HOST=127.0.0.1 \
 *     yarn workspace @tbcm/api db:copy-performance:benchmark optimized-full-wizard 30 \
 *       --full-wizard-only
 *
 * Options:
 * --rollback runs the default scenarios, then deliberately fails permission
 *   INSERT batch 2 of a large copy. It checks zero surviving copy rows, retries
 *   the same name, and exercises customized LC details. This requires enough
 *   existing references for more than 5,000 pairs, an active limit catalogue
 *   entry, and a Y permission in the sparse scenario. It does not roll back
 *   source code, the source template, or the fixture.
 * --full-wizard-only replaces the default scenarios with the complete unchanged
 *   wizard snapshot: all returned non-N permissions, including unselected
 *   activities and invalid references. Invalid references must cause an explicit
 *   400 with no copy, not silent omission; inspect the reported outcome rather
 *   than treating an error-path timing as successful-copy performance.
 * --http-url http://127.0.0.1:4000/api/v1 uses a separately running local API.
 *   Supply COPY_BENCHMARK_BEARER_TOKEN securely from normal login and set
 *   COPY_BENCHMARK_HEALTH_AUTHORITY to the user's copy scope (GLOBAL for ADMIN).
 *   A direct local Node listener and a fresh database identity probe are required
 *   before each POST. Never put credentials in command arguments or reports.
 * --output PATH.json overrides .build/copy-performance/LABEL.json. Reusing a
 *   report path replaces its contents; choose distinct labels to retain results.
 * The full-wizard option cannot be combined with HTTP or rollback; HTTP cannot
 * be combined with rollback.
 *
 * Every successful copy is read back and compared by values, LC details,
 * selections, and metadata. Normal runs remove their owned copies but leave the
 * seeded master permissions until explicit fixture cleanup. If validation,
 * journaling, or cleanup fails, the command exits unsuccessfully and may retain
 * records for reconciliation. Do not discard ownership.json to force cleanup.
 *
 * Timing scope: service mode excludes HTTP authentication/DTO validation,
 * transport, browser rendering, and list navigation. Serialization is reported
 * separately; durable ownership journaling and read-back are outside copy timing.
 * sqlMs sums query durations, while sqlWallMs merges overlapping query intervals.
 * The initial sample is not an AWS cold-start measurement, and these results do
 * not establish the dev end-to-end target. See docs/runbooks.md for interpretation.
 */
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  CreateCareSettingTemplateCopyFullDTO,
  normalizeRestrictionDescription,
  Permissions,
  TemplateLevel,
} from '@tbcm/common';
import { CareSettingTemplateService } from '../../unit/care-setting-template.service';
import { CareSettingTemplate } from '../../unit/entity/care-setting-template.entity';
import { CareSettingTemplatePermission } from '../../unit/entity/care-setting-template-permission.entity';
import { Unit } from '../../unit/entity/unit.entity';
import { Bundle } from '../../care-activity/entity/bundle.entity';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';
import { AllowedActivity } from '../../allowed-activity/entity/allowed-activity.entity';
import { LimitCondition } from '../../unit/entity/limit-condition.entity';
import {
  ARTIFACTS,
  cleanupOwned,
  connectLocal,
  failSafely,
  fingerprint,
  LocalContext,
  LocalDiagnosticError,
  lockTemplateContent,
  MANIFEST,
  PREVIEW,
  report,
  ROOT,
  templateFingerprint,
  writeJson,
} from './copy-performance-local';

interface QueryMetrics {
  count: number;
  sqlMs: number;
  maxParameters: number;
}
interface Observation {
  totalMs: number;
  sqlMs: number;
  sqlWallMs: number;
  serializationMs: number;
  requestBytes: number;
  phases: Record<string, QueryMetrics>;
}

/**
 * Measure time covered by at least one SQL call without double-counting overlap.
 * Parallel reference queries contribute once to wall time, unlike cumulative sqlMs.
 *
 * @param intervals - Start/end timestamps in milliseconds from the same monotonic
 * clock, with 0 <= start <= end. May be unsorted; the input is not mutated.
 * @returns Duration of the union of intervals in milliseconds, or zero for no calls.
 * @example
 * sqlWallDuration([[0, 10], [5, 15], [20, 25]]); // 20
 */
export function sqlWallDuration(intervals: readonly (readonly [number, number])[]): number {
  let total = 0;
  let previousEnd = 0;
  for (const [start, end] of [...intervals].sort((a, b) => a[0] - b[0])) {
    total += Math.max(0, end - Math.max(start, previousEnd));
    previousEnd = Math.max(previousEnd, end);
  }
  return total;
}

/**
 * Assign a SQL statement to the benchmark's coarse persistence phase.
 * This is a case-insensitive pattern classifier, not a SQL parser or query logger.
 *
 * @param sql - Statement text to classify; leading/trailing whitespace is ignored.
 * @returns `transaction`, `permissionWrite`, `relationWrite`, or `templateWrite`
 * for recognized statements; `referenceRead` for reads and other unclassified SQL.
 */
export function queryPhase(sql: string): string {
  const statement = sql.trim();
  if (/^(START TRANSACTION|COMMIT|ROLLBACK|SET TRANSACTION)/i.test(statement)) return 'transaction';
  const write = /^(INSERT|UPDATE|DELETE)/i.test(statement);
  if (write && /care_setting_template_permission/i.test(statement)) return 'permissionWrite';
  if (write && /care_setting_template_(activities|bundles)/i.test(statement))
    return 'relationWrite';
  if (write && /care_setting_template/i.test(statement)) return 'templateWrite';
  return 'referenceRead';
}

/**
 * Summarize warm observations without altering their recorded order.
 * The caller excludes the separately reported first call before using this helper.
 *
 * @param values - Nonempty array of finite numeric samples. This precondition is
 * not validated here; benchmark supplies at least one warm observation.
 * @returns Median (mean of the two middle values for an even count), nearest-rank
 * p95, minimum, and maximum in the input unit, milliseconds in benchmark reports.
 */
export function summary(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    median:
      (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Reproduce the wizard's permission payload without "repairing" its source.
 * Unselected-activity permissions and unresolved references remain present so
 * read-back/error checks can detect data loss; only N is represented by absence.
 *
 * @param copyData - Complete getTemplateForCopy response, before matrix filtering
 * or reference cleanup. Its arrays and permission objects are not modified.
 * @returns A new copy DTO with copied selections and non-N permission entries,
 * preserving their LC details. The caller must replace its empty destination name.
 * @throws {LocalDiagnosticError} If a non-N entry is neither Y nor LC.
 */
export function fullWizardSnapshot(
  copyData: Awaited<ReturnType<CareSettingTemplateService['getTemplateForCopy']>>,
): CreateCareSettingTemplateCopyFullDTO {
  return {
    name: '',
    selectedBundleIds: [...copyData.selectedBundleIds],
    selectedActivityIds: [...copyData.selectedActivityIds],
    permissions: copyData.permissions
      .filter(row => row.permission !== Permissions.NO)
      .map(row => {
        if (row.permission !== Permissions.PERFORM && row.permission !== Permissions.LIMITS) {
          throw new LocalDiagnosticError('Copy-data returned an unsupported permission value.');
        }
        return { ...row, permission: row.permission };
      }),
  };
}

/**
 * Prove the API reads the same database as the guarded local connection.
 * A loopback URL alone is insufficient: a local API could still use a remote DB.
 * Journal a uniquely identified metadata-only probe, resolve it through an
 * authenticated read, and clean only that probe's owned ID before permitting POST.
 *
 * @param context - Verified local context with no active transaction. Its source
 * supplies the probe's unit/parent and its journal tracks the probe before commit.
 * @param read - Authenticated JSON GET function accepting an API-relative path.
 * It must query the same API that will receive the subsequent copy request.
 * @returns Resolves after the exact probe is read successfully and cleaned up.
 * The HTTP client can then grant one POST; this function itself issues no POST.
 * @throws {LocalDiagnosticError} If probe persistence or response identity differs.
 * @throws Propagates database, journal, authenticated-read, and cleanup failures.
 * Cleanup is attempted after the read even when the read rejects or mismatches.
 */
export async function verifyHttpDatabase(
  context: LocalContext,
  read: (path: string) => Promise<unknown>,
): Promise<void> {
  const id = randomUUID();
  const name = `Copy performance probe ${randomUUID()}`;
  const { runner, ownership, source } = context;
  await runner.startTransaction();
  try {
    await runner.query(
      `INSERT INTO care_setting_template (id, name, is_master, health_authority, level, unit_id, parent_id)
       VALUES ($1, $2, false, 'GLOBAL', $3, $4, $5)`,
      [id, name, TemplateLevel.HEALTH_AUTHORITY, source.unit_id, source.id],
    );
    const hash = await templateFingerprint(runner, id);
    if (!hash) throw new LocalDiagnosticError('The local HTTP database probe was not persisted.');
    ownership.templates.push({ id, fingerprint: hash });
    writeJson(MANIFEST, ownership);
    await runner.commitTransaction();
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  }
  try {
    const response = await read(`/care-settings/${id}`);
    if (
      !response ||
      typeof response !== 'object' ||
      !('id' in response) ||
      response.id !== id ||
      !('name' in response) ||
      response.name !== name ||
      !('healthAuthority' in response) ||
      response.healthAuthority !== 'GLOBAL' ||
      !('isMaster' in response) ||
      response.isMaster !== false
    ) {
      throw new LocalDiagnosticError(
        'HTTP API did not resolve the exact local database probe; POST refused.',
      );
    }
  } finally {
    await cleanupOwned(context, false, [id]);
  }
}

/**
 * Create an authenticated loopback client; the base URL includes the API prefix.
 * Call verifyDatabase before every request with a body. A successful probe grants
 * only one POST, and redirects are rejected rather than forwarding credentials.
 *
 * @param base - Plain HTTP localhost/127.0.0.1 API base URL, such as
 * http://127.0.0.1:4000/api/v1, without URL credentials, query, or fragment.
 * @returns A client with the health authority captured from
 * COPY_BENCHMARK_HEALTH_AUTHORITY, verifyDatabase, and JSON request methods.
 * COPY_BENCHMARK_BEARER_TOKEN is captured privately from the environment.
 * @throws {TypeError} If base cannot be parsed as a URL.
 * @throws {LocalDiagnosticError} If configuration is unsafe/incomplete or the port
 * is not owned by one direct Node listener running from this repository.
 * @throws Propagates lsof process-inspection failures.
 */
export function authenticatedHttp(base: string) {
  const url = new URL(base);
  const token = process.env.COPY_BENCHMARK_BEARER_TOKEN;
  const healthAuthority = process.env.COPY_BENCHMARK_HEALTH_AUTHORITY;
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !token ||
    !healthAuthority
  ) {
    throw new LocalDiagnosticError(
      'HTTP mode requires a loopback http URL, COPY_BENCHMARK_BEARER_TOKEN, and COPY_BENCHMARK_HEALTH_AUTHORITY.',
    );
  }
  const listener = execFileSync(
    'lsof',
    ['-nP', `-iTCP:${url.port || 80}`, '-sTCP:LISTEN', '-Fpc'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const pids = [...listener.matchAll(/^p(\d+)$/gm)].map(match => match[1]);
  if (pids.length !== 1 || !/^c(node|nodejs)$/m.test(listener)) {
    throw new LocalDiagnosticError(
      'HTTP mode requires one direct local Node listener, not a proxy/tunnel.',
    );
  }
  const cwd = execFileSync('lsof', ['-a', '-p', pids[0], '-d', 'cwd', '-Fn'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).match(/^n(.+)$/m)?.[1];
  if (cwd !== ROOT && !cwd?.startsWith(`${ROOT}/`)) {
    throw new LocalDiagnosticError('HTTP listener must run directly from this repository.');
  }
  let verifiedForPost = false;
  return {
    healthAuthority,
    /**
     * Replace any previous POST grant with a fresh authenticated database proof.
     *
     * @param context - Guarded local context to prove against this client's API.
     * Invoke on the client object, not as a detached method, because it uses this.request.
     * @returns Resolves with exactly one POST permitted after successful probe cleanup.
     * @throws Propagates probe/read/cleanup failures; no POST grant remains on failure.
     */
    async verifyDatabase(context: LocalContext): Promise<void> {
      verifiedForPost = false;
      await verifyHttpDatabase(context, path => this.request<unknown>(path));
      verifiedForPost = true;
    },
    /**
     * Send an authenticated JSON GET or one freshly authorized POST.
     * A POST consumes its grant before network access, including when the request
     * later fails. Requests reject redirects and use a 120-second timeout.
     *
     * @template T - Expected JSON response type; no runtime schema validation is done.
     * @param path - API-relative path beginning with `/`, appended to the base URL.
     * @param body - Already serialized JSON for POST; undefined selects GET.
     * @returns Parsed successful response JSON, typed as T.
     * @throws {LocalDiagnosticError} If POST lacks a fresh grant or HTTP status is
     * unsuccessful. Error response bodies are deliberately omitted from diagnostics.
     * @throws Propagates transport, timeout, redirect, and JSON-decoding failures.
     */
    async request<T>(path: string, body?: string): Promise<T> {
      if (body !== undefined) {
        if (!verifiedForPost) {
          throw new LocalDiagnosticError(
            'A fresh authenticated local database probe is required before every HTTP POST.',
          );
        }
        verifiedForPost = false;
      }
      const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok)
        throw new LocalDiagnosticError(
          `Authenticated HTTP request failed with status ${response.status}; response body omitted.`,
        );
      return response.json() as Promise<T>;
    },
  };
}

/**
 * Construct the real copy service against the guarded diagnostic DataSource.
 * This measures service/database work without bootstrapping Nest's HTTP pipeline;
 * authentication, request transformation, and controller overhead are not exercised.
 *
 * @param context - Initialized local context whose DataSource owns all repositories.
 * @returns A CareSettingTemplateService using that connection for each dependency.
 * The service does not own resource teardown; the caller must still close context.
 */
export function makeService(context: LocalContext) {
  /**
   * Obtain a typed repository from the single diagnostic connection.
   *
   * @template T - Entity row type.
   * @param entity - Registered TypeORM entity target.
   * @returns Repository bound to context.dataSource, without fetching any rows.
   */
  const repo = <T extends ObjectLiteral>(entity: EntityTarget<T>) =>
    context.dataSource.getRepository(entity);
  return new CareSettingTemplateService(
    repo(CareSettingTemplate),
    repo(CareSettingTemplatePermission),
    repo(Unit),
    repo(Bundle),
    repo(CareActivity),
    repo(Occupation),
    repo(AllowedActivity),
    repo(LimitCondition),
  );
}

/**
 * Instrument this diagnostic DataSource only, without retaining SQL or bind values.
 * start/stop delimit a measured call; restore reinstates the runner factory on exit.
 * Service-created template IDs are journaled before COMMIT even when timing is
 * inactive, so retry/customization copies also remain eligible for safe cleanup.
 * Only runners created after installation are wrapped; the context's pre-existing
 * runner remains available for untimed read-back and cleanup.
 *
 * @param context - Dedicated local context whose runner factory is replaced and
 * whose mutable ownership journal records copies before they commit.
 * @returns start/stop/restore controls for sequential measurement windows. Call
 * restore in finally after all service work; it does not close the context.
 * @throws Wrapped queries propagate database, missing-generated-ID, and journal
 * failures. A configured failure index throws before that permission INSERT executes.
 */
function instrument(context: LocalContext) {
  const original = context.dataSource.createQueryRunner.bind(context.dataSource);
  let active: Observation | undefined;
  let permissionInsert = 0;
  let failInsert = 0;
  let pause = false;
  let journalMs = 0;
  let createdIds: string[] = [];
  let queryIntervals: [number, number][] = [];
  context.dataSource.createQueryRunner = (...args) => {
    const runner = original(...args);
    const query = runner.query.bind(runner);
    let createdId: string | undefined;
    runner.query = async (sql: string, binds?: unknown[], structured?: boolean) => {
      if (pause) return query(sql, binds, structured);
      const phase = queryPhase(sql);
      if (/^COMMIT/i.test(sql) && createdId) {
        const start = performance.now();
        pause = true;
        try {
          const hash = await templateFingerprint(runner, createdId);
          assert(hash, 'Copy is missing before commit.');
          context.ownership.templates.push({ id: createdId, fingerprint: hash });
          writeJson(MANIFEST, context.ownership);
        } finally {
          pause = false;
          journalMs += performance.now() - start;
        }
      }
      if (phase === 'permissionWrite' && /^INSERT/i.test(sql.trim())) {
        permissionInsert++;
        if (failInsert && permissionInsert === failInsert) {
          throw new Error('Injected later permission batch failure.');
        }
      }
      const start = performance.now();
      try {
        const result = await query(sql, binds, structured);
        if (/^INSERT INTO "?care_setting_template"?\s*\(/i.test(sql.trim())) {
          createdId = result.records?.[0]?.id ?? result[0]?.id;
          assert(createdId, 'Template INSERT did not return its generated ID.');
          createdIds.push(createdId);
        }
        return result;
      } finally {
        if (active) {
          const end = performance.now();
          const elapsed = end - start;
          queryIntervals.push([start, end]);
          const metric = (active.phases[phase] ??= { count: 0, sqlMs: 0, maxParameters: 0 });
          metric.count++;
          metric.sqlMs += elapsed;
          metric.maxParameters = Math.max(metric.maxParameters, binds?.length ?? 0);
          active.sqlMs += elapsed;
        }
      }
    };
    return runner;
  };
  return {
    /**
     * Begin one timing window and reset internal query/failure/journaling counters.
     *
     * @param observation - Fresh zero-initialized metrics record, mutated as queries
     * finish. Existing numeric fields are not reset by this method.
     * @param failure - One-based permission INSERT index at which to throw before
     * execution; zero disables injection. Use 2 to exercise later-batch rollback.
     * @returns Nothing. Do not overlap windows; call stop after the measured operation.
     */
    start(observation: Observation, failure = 0) {
      active = observation;
      permissionInsert = 0;
      failInsert = failure;
      journalMs = 0;
      createdIds = [];
      queryIntervals = [];
    },
    /**
     * End timing, finalize the observation's SQL wall time, and disable injection.
     * Ownership journaling remains installed for subsequent untimed service calls.
     *
     * @returns journalMs to subtract from elapsed service time, permissionInsert
     * count including an injected failed attempt, and generated createdIds, which
     * can include IDs later rolled back and are not proof of committed copies.
     */
    stop() {
      if (active) active.sqlWallMs = sqlWallDuration(queryIntervals);
      active = undefined;
      failInsert = 0;
      return { journalMs, permissionInsert, createdIds };
    },
    /**
     * Restore the original DataSource runner factory after diagnostic service work.
     *
     * @returns Nothing. Existing wrapped runners are not rewritten or released;
     * this neither closes context nor deletes journal-owned records.
     */
    restore() {
      context.dataSource.createQueryRunner = original;
    },
  };
}

/**
 * Compare stored content with the submitted snapshot, independent of row order.
 * Counts alone would miss changed permissions, missing LC details, or wrong
 * selections. This function does not acquire locks: HTTP ownership callers must
 * hold content locks across both this validation and fingerprint capture.
 *
 * @param context - Local context whose source is the expected master parent/unit.
 * @param id - Persisted destination template UUID to read, not a name lookup.
 * @param dto - Expected snapshot using canonical UUIDs. Selection IDs are deduplicated
 * for comparison; LC descriptions use shared normalization and non-LC details are null.
 * @param healthAuthority - Expected destination HA, independent of the master's HA.
 * @returns Resolves without a value only when metadata, selections, and every
 * permission/LC detail match. No rows or ownership entries are changed.
 * @throws {AssertionError} If the template is missing or any compared content differs.
 * @throws Propagates database read failures.
 */
export async function assertCopy(
  context: LocalContext,
  id: string,
  dto: CreateCareSettingTemplateCopyFullDTO,
  healthAuthority: string,
): Promise<void> {
  const { runner, source } = context;
  const [template] = await runner.query(
    `SELECT name, parent_id, unit_id, health_authority, level, is_master, version
     FROM care_setting_template WHERE id = $1`,
    [id],
  );
  assert.deepEqual(template, {
    name: dto.name,
    parent_id: source.id,
    unit_id: source.unit_id,
    health_authority: healthAuthority,
    level: dto.level ?? TemplateLevel.HEALTH_AUTHORITY,
    is_master: false,
    version: 0,
  });
  const bundles: { id: string }[] = await runner.query(
    'SELECT bundle_id AS id FROM care_setting_template_bundles WHERE care_setting_template_id = $1',
    [id],
  );
  const activities: { id: string }[] = await runner.query(
    'SELECT care_activity_id AS id FROM care_setting_template_activities WHERE care_setting_template_id = $1',
    [id],
  );
  assert.deepEqual(bundles.map(row => row.id).sort(), [...new Set(dto.selectedBundleIds)].sort());
  assert.deepEqual(
    activities.map(row => row.id).sort(),
    [...new Set(dto.selectedActivityIds)].sort(),
  );
  const actual: Required<CreateCareSettingTemplateCopyFullDTO>['permissions'] = await runner.query(
    `SELECT care_activity_id AS "activityId", occupation_id AS "occupationId",
       permission, limit_condition_id AS "limitId", restriction_description AS "restrictionDescription"
     FROM care_setting_template_permission WHERE template_id = $1`,
    [id],
  );
  const expected = dto.permissions.map(permission => ({
    activityId: permission.activityId,
    occupationId: permission.occupationId,
    permission: permission.permission,
    limitId: permission.permission === Permissions.LIMITS ? permission.limitId ?? null : null,
    restrictionDescription:
      permission.permission === Permissions.LIMITS
        ? normalizeRestrictionDescription(permission.restrictionDescription)
        : null,
  }));
  /**
   * Build a shared sort key so database row order cannot affect exact comparisons.
   *
   * @param row - Permission identified by its canonical activity and occupation UUIDs.
   * @returns Colon-separated activity/occupation key used by both compared arrays.
   */
  const order = (row: { activityId: string; occupationId: string }) =>
    `${row.activityId}:${row.occupationId}`;
  assert.deepEqual(
    actual.sort((a, b) => order(a).localeCompare(order(b))),
    expected.sort((a, b) => order(a).localeCompare(order(b))),
  );
}

/**
 * Turn a matching pending HTTP request into cleanup ownership without adopting
 * an intervening edit. Validate and fingerprint under the same transaction's
 * content locks, then durably record that snapshot before clearing pending state.
 * An edit after capture changes the cleanup fingerprint and prevents deletion.
 *
 * @param context - Verified local context with the matching pendingHttp entry and
 * no active transaction. Its in-memory journal changes only after writeJson succeeds.
 * @param id - Exact copy UUID returned by the authenticated POST.
 * @param dto - Submitted snapshot whose name and JSON fingerprint match pendingHttp.
 * @param healthAuthority - Destination HA matching the pending request and stored copy.
 * @returns Resolves once validated ownership is durable and pendingHttp is cleared;
 * does not delete the copy or close context.
 * @throws {LocalDiagnosticError} If the pending request is missing or mismatched.
 * @throws {AssertionError} If the committed copy differs from the submitted snapshot.
 * @throws Propagates transaction, fingerprint, and journal-write failures. Any active
 * transaction is rolled back, and in-memory pending state is retained on failure.
 */
export async function finalizeHttpOwnership(
  context: LocalContext,
  id: string,
  dto: CreateCareSettingTemplateCopyFullDTO,
  healthAuthority: string,
): Promise<void> {
  const { runner, ownership } = context;
  const pending = ownership.pendingHttp;
  if (
    !pending ||
    pending.name !== dto.name ||
    pending.healthAuthority !== healthAuthority ||
    pending.requestHash !== fingerprint(dto)
  ) {
    throw new LocalDiagnosticError('Pending HTTP request does not match the copy being finalized.');
  }
  await runner.startTransaction();
  try {
    await lockTemplateContent(runner);
    await assertCopy(context, id, dto, healthAuthority);
    const hash = await templateFingerprint(runner, id);
    assert(hash);
    await runner.commitTransaction();

    // Keep the locked snapshot's hash: edits after COMMIT must fail cleanup,
    // not become part of the ownership baseline.
    const finalized = {
      ...ownership,
      templates: [...ownership.templates, { id, fingerprint: hash }],
    };
    delete finalized.pendingHttp;
    writeJson(MANIFEST, finalized);
    ownership.templates = finalized.templates;
    delete ownership.pendingHttp;
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
  }
}

/**
 * Run the requested scenarios, write aggregate/observation JSON, and close resources.
 * Requires the dense fixture first, including cells already stored as N. Normal
 * completion cleans owned benchmark copies but leaves owned fixture permissions.
 * If execution fails, retain the journal for guarded cleanup or HTTP reconciliation.
 *
 * @param label - Alphanumeric/hyphen report label, also used in temporary copy names;
 * never selects an old/new service implementation.
 * @param warmCount - Positive integer of measured warm calls per scenario, in addition
 * to one separately reported initial call. The CLI defaults to 30.
 * @param rollback - Add service-only second-batch failure, zero-orphan, same-name retry,
 * and customized-LC assertions. Requires over 5,000 real reference pairs, an active
 * catalogue limit, and a Y entry in the sparse snapshot.
 * @param httpUrl - Optional authenticated loopback API base URL, including /api/v1.
 * Omit for direct service measurements; HTTP mode cannot expose in-process SQL metrics.
 * @param outputFile - JSON destination, defaulting to .build/copy-performance/LABEL.json
 * under the repo root. Explicit relative paths use the process working directory.
 * Existing reports are replaced; ownership/preview paths are reserved.
 * @param fullWizardOnly - Run only the untouched non-N wizard snapshot, including
 * unselected-activity permissions, instead of dense/sparse/empty matrix scenarios.
 * Cannot combine with HTTP or rollback; invalid references must produce 400/no copy.
 * @returns Resolves without a value after writing the final report, restoring the
 * runner factory, and closing the local context. Serialization is reported separately;
 * ownership/read-back time is outside service timing and no mode measures browser UX.
 * @throws Rejects invalid arguments, unsafe targets, incomplete fixtures, incorrect
 * persistence/rollback results, and I/O failures. May leave a partial report or owned
 * records for reconciliation; never discard the ownership manifest to bypass a refusal.
 */
export async function benchmark(
  label: string,
  warmCount: number,
  rollback: boolean,
  httpUrl?: string,
  outputFile = join(ARTIFACTS, `${label}.json`),
  fullWizardOnly = false,
): Promise<void> {
  if (
    typeof label !== 'string' ||
    !/^[a-z0-9-]+$/i.test(label) ||
    !Number.isInteger(warmCount) ||
    warmCount < 1
  ) {
    throw new Error('Require a simple label and positive warm observation count.');
  }
  if (!outputFile.endsWith('.json') || [MANIFEST, PREVIEW].includes(resolve(outputFile))) {
    throw new LocalDiagnosticError(
      'Choose a JSON report path distinct from the ownership and preview files.',
    );
  }
  if (fullWizardOnly && (httpUrl || rollback)) {
    throw new LocalDiagnosticError(
      'Full-wizard-only is a separate service case; omit HTTP and rollback options.',
    );
  }
  const http = httpUrl ? authenticatedHttp(httpUrl) : undefined;
  const healthAuthority = http?.healthAuthority ?? 'COPY_PERFORMANCE_LOCAL';
  if (http && rollback)
    throw new LocalDiagnosticError(
      'Failure injection is service-only; use a separate --rollback run.',
    );
  const context = await connectLocal();
  const profiler = instrument(context);
  const service = makeService(context);
  const output: Record<string, unknown> = {
    label,
    mode: http ? 'authenticated local HTTP' : 'service (not HTTP)',
    identity: context.identity,
    node: process.version,
    logging: false,
    migrations: false,
    subscribers: false,
    warmCount,
    serviceHash: fingerprint(
      readFileSync(join(__dirname, '../../unit/care-setting-template.service.ts'), 'utf8'),
    ),
    limitations: [
      http
        ? 'No browser rendering or navigation; SQL phases cannot be observed across HTTP.'
        : 'No HTTP/auth/DTO transformation, upload, browser rendering, or list navigation included.',
      'Fresh process first run reported separately; not an AWS Lambda cold start.',
      'Durable ownership journal/readback time excluded from service execution timing.',
      'Query durations include driver/transport; remaining time includes ORM/application work.',
      'sqlMs sums query durations; sqlWallMs merges overlapping queries. Non-SQL time subtracts sqlWallMs.',
    ],
  };
  /**
   * Allocate an independent zeroed record for one load or copy measurement.
   *
   * @returns Millisecond timing counters, a byte counter, and a fresh phase map
   * ready for profiler.start; records must not be shared between observations.
   */
  const emptyObservation = (): Observation => ({
    totalMs: 0,
    sqlMs: 0,
    sqlWallMs: 0,
    serializationMs: 0,
    requestBytes: 0,
    phases: {},
  });
  try {
    await cleanupOwned(context, false);
    if (http) await http.verifyDatabase(context);
    const loading = emptyObservation();
    profiler.start(loading);
    const loadStart = performance.now();
    const copyData = http
      ? await http.request<Awaited<ReturnType<typeof service.getTemplateForCopy>>>(
          `/care-settings/${context.source.id}/copy-data`,
        )
      : await service.getTemplateForCopy(context.source.id);
    loading.totalMs = performance.now() - loadStart;
    profiler.stop();
    output.copyData = loading;
    const occupations: { id: string }[] = await context.runner.query(
      'SELECT id FROM occupation WHERE deleted_at IS NULL ORDER BY id',
    );
    const activeOccupations = new Set(occupations.map(row => row.id));
    const selectedActivities = new Set(copyData.selectedActivityIds);
    const matrixRows = copyData.permissions.filter(
      row => selectedActivities.has(row.activityId) && activeOccupations.has(row.occupationId),
    );
    // Existing N rows cover matrix cells even though the wizard omits them on save.
    assert.equal(
      new Set(matrixRows.map(row => `${row.activityId}:${row.occupationId}`)).size,
      selectedActivities.size * activeOccupations.size,
      'Run the dense fixture first.',
    );
    const permissions = matrixRows
      .filter(row => row.permission !== Permissions.NO)
      .sort((a, b) =>
        `${a.activityId}:${a.occupationId}`.localeCompare(`${b.activityId}:${b.occupationId}`),
      )
      .map(row => ({ ...row, permission: row.permission as Permissions }));
    const dense: CreateCareSettingTemplateCopyFullDTO = {
      name: '',
      selectedBundleIds: [...copyData.selectedBundleIds].sort(),
      selectedActivityIds: [...copyData.selectedActivityIds].sort(),
      permissions,
    };
    const fullWizard = fullWizardSnapshot(copyData);
    const snapshot = fullWizardOnly ? fullWizard : dense;
    const [referenceCounts]: {
      invalidPermissionPairs: number;
      missingActivities: number;
      missingOccupations: number;
      deletedOccupations: number;
    }[] = fullWizardOnly
      ? await context.runner.query(
          `SELECT count(*) FILTER (WHERE a.id IS NULL OR o.id IS NULL OR o.deleted_at IS NOT NULL)::int AS "invalidPermissionPairs",
         count(DISTINCT refs.activity_id) FILTER (WHERE a.id IS NULL)::int AS "missingActivities",
         count(DISTINCT refs.occupation_id) FILTER (WHERE o.id IS NULL)::int AS "missingOccupations",
         count(DISTINCT refs.occupation_id) FILTER (WHERE o.deleted_at IS NOT NULL)::int AS "deletedOccupations"
       FROM unnest($1::uuid[], $2::uuid[]) AS refs(activity_id, occupation_id)
       LEFT JOIN care_activity a ON a.id = refs.activity_id
       LEFT JOIN occupation o ON o.id = refs.occupation_id`,
          [
            fullWizard.permissions.map(row => row.activityId),
            fullWizard.permissions.map(row => row.occupationId),
          ],
        )
      : [];
    const lc = permissions.filter(row => row.permission === Permissions.LIMITS);
    const sparse = [
      ...new Map(
        [...lc, ...permissions.slice(0, 20)].map(row => [
          `${row.activityId}:${row.occupationId}`,
          row,
        ]),
      ).values(),
    ];
    output.dataset = {
      scope: fullWizardOnly
        ? 'full-wizard snapshot: all returned non-N entries'
        : 'selected-matrix customized snapshot',
      activities: dense.selectedActivityIds.length,
      occupations: activeOccupations.size,
      bundles: dense.selectedBundleIds.length,
      permissions: snapshot.permissions.length,
      lc: snapshot.permissions.filter(row => row.permission === Permissions.LIMITS).length,
      returnedOutsideMatrix: fullWizard.permissions.length - permissions.length,
      returnedPermissions: copyData.permissions.length,
      omittedNPermissions: copyData.permissions.length - fullWizard.permissions.length,
      matrixCells: selectedActivities.size * activeOccupations.size,
      preservedMatrixNPermissions: matrixRows.filter(row => row.permission === Permissions.NO)
        .length,
      snapshotHash: fingerprint(snapshot),
      distinctPermissionActivities: new Set(snapshot.permissions.map(row => row.activityId)).size,
      distinctPermissionOccupations: new Set(snapshot.permissions.map(row => row.occupationId))
        .size,
      referenceCounts,
    };
    const datasets: Record<string, CreateCareSettingTemplateCopyFullDTO> = fullWizardOnly
      ? { fullWizard }
      : {
          dense,
          sparse: { ...dense, level: TemplateLevel.SITE, permissions: sparse },
          empty: { ...dense, selectedBundleIds: [], selectedActivityIds: [], permissions: [] },
        };
    const results: Record<string, unknown> = {};
    output.results = results;
    for (const [dataset, request] of Object.entries(datasets)) {
      const observations: Observation[] = [];
      for (let index = 0; index <= warmCount; index++) {
        const dto = {
          ...request,
          name: `Copy perf ${label} ${dataset} ${String(index).padStart(3, '0')}`,
        };
        const observation = emptyObservation();
        const serializationStart = performance.now();
        const body = JSON.stringify(dto);
        observation.requestBytes = Buffer.byteLength(body);
        observation.serializationMs = performance.now() - serializationStart;
        if (http) {
          await http.verifyDatabase(context);
          // Unknown HTTP commit outcome is retained for manual reconciliation, never guessed by name.
          context.ownership.pendingHttp = {
            name: dto.name,
            healthAuthority,
            requestHash: fingerprint(dto),
          };
          writeJson(MANIFEST, context.ownership);
        }
        profiler.start(observation);
        const start = performance.now();
        let result: { id: string } | undefined;
        try {
          result = http
            ? await http.request<{ id: string }>(
                `/care-settings/${context.source.id}/copy-full`,
                body,
              )
            : await service.copyTemplateWithData(context.source.id, dto, healthAuthority);
        } catch (error) {
          if (
            !fullWizardOnly ||
            !referenceCounts.invalidPermissionPairs ||
            !(error instanceof BadRequestException)
          ) {
            throw error;
          }
          assert.equal(error.getStatus(), 400);
        }
        const elapsed = performance.now() - start;
        const { journalMs, createdIds } = profiler.stop();
        observation.totalMs = elapsed - journalMs;
        if (result) {
          if (fullWizardOnly)
            assert.equal(
              referenceCounts.invalidPermissionPairs,
              0,
              'Invalid references were silently accepted.',
            );
          if (http) {
            await finalizeHttpOwnership(context, result.id, dto, healthAuthority);
          } else {
            await assertCopy(context, result.id, dto, healthAuthority);
          }
        } else {
          const [remaining] = await context.runner.query(
            `SELECT count(*)::int AS count FROM care_setting_template
             WHERE (name = $1 AND health_authority = $2) OR id = ANY($3::uuid[])`,
            [dto.name, healthAuthority, createdIds],
          );
          assert.equal(remaining.count, 0, 'Rejected full-wizard snapshot left a copy.');
        }
        observations.push(observation);
        await cleanupOwned(context, false);
        if (index === 0 || index % 5 === 0) {
          report({ label, dataset, completedWarm: index, serviceMs: observation.totalMs });
        }
      }
      const warm = observations.slice(1);
      results[dataset] = {
        outcome:
          fullWizardOnly && referenceCounts.invalidPermissionPairs
            ? 'explicit 400: invalid/deleted references; no copy'
            : 'persisted: exact full readback',
        permissions: request.permissions.length,
        firstRun: observations[0],
        observations: warm,
        warm: {
          serviceMs: summary(warm.map(row => row.totalMs)),
          sqlMs: summary(warm.map(row => row.sqlMs)),
          sqlWallMs: summary(warm.map(row => row.sqlWallMs)),
          nonSqlMs: summary(warm.map(row => row.totalMs - row.sqlWallMs)),
          serializationMs: summary(warm.map(row => row.serializationMs)),
        },
      };
      writeJson(outputFile, output);
      report({
        label,
        dataset,
        permissions: request.permissions.length,
        warm: (results[dataset] as { warm: unknown }).warm,
      });
    }
    if (rollback) {
      const allActivities = await context.runner.query('SELECT id FROM care_activity ORDER BY id');
      const expanded = new Map(
        permissions.map(row => [`${row.activityId}:${row.occupationId}`, row]),
      );
      for (const activity of allActivities) {
        for (const occupation of occupations) {
          const key = `${activity.id}:${occupation.id}`;
          if (!expanded.has(key))
            expanded.set(key, {
              activityId: activity.id,
              occupationId: occupation.id,
              permission: Permissions.PERFORM,
              limitId: null,
              restrictionDescription: null,
            });
          if (expanded.size >= 10001) break;
        }
        if (expanded.size >= 10001) break;
      }
      assert(expanded.size > 5000, 'Insufficient real references for a later-batch rollback test.');
      const dto = {
        ...dense,
        name: `Copy perf ${label} rollback`,
        permissions: [...expanded.values()],
      };
      const observation = emptyObservation();
      profiler.start(observation, 2);
      await assert.rejects(
        service.copyTemplateWithData(context.source.id, dto, healthAuthority),
        /Injected later permission batch failure/,
      );
      const failed = profiler.stop();
      assert.equal(
        failed.createdIds.length,
        1,
        'Expected a template INSERT before the injected failure.',
      );
      const [orphans] = await context.runner.query(
        `SELECT
          (SELECT count(*)::int FROM care_setting_template WHERE id = ANY($1::uuid[])) AS templates,
          (SELECT count(*)::int FROM care_setting_template_permission WHERE template_id = ANY($1::uuid[])) AS permissions,
          (SELECT count(*)::int FROM care_setting_template_bundles WHERE care_setting_template_id = ANY($1::uuid[])) AS bundles,
          (SELECT count(*)::int FROM care_setting_template_activities WHERE care_setting_template_id = ANY($1::uuid[])) AS activities`,
        [failed.createdIds],
      );
      assert.deepEqual(orphans, { templates: 0, permissions: 0, bundles: 0, activities: 0 });
      const [{ count }] = await context.runner.query(
        'SELECT count(*)::int AS count FROM care_setting_template WHERE name = $1 AND health_authority = $2',
        [dto.name, healthAuthority],
      );
      assert.equal(count, 0, 'Failed copy left an orphan template.');
      const retry = await service.copyTemplateWithData(context.source.id, dto, healthAuthority);
      await assertCopy(context, retry.id, dto, healthAuthority);
      await cleanupOwned(context, false);
      const [limit] = await context.runner.query(
        'SELECT id FROM limit_condition WHERE is_active ORDER BY id LIMIT 1',
      );
      assert(limit, 'The local catalogue needs one active limit for LC correctness.');
      const customPermissions = sparse.map(permission => ({ ...permission }));
      const changed = customPermissions.find(
        permission => permission.permission === Permissions.PERFORM,
      );
      assert(changed);
      changed.permission = Permissions.LIMITS;
      changed.limitId = limit.id;
      changed.restrictionDescription = '  Local benchmark restriction  ';
      const customized = {
        ...dense,
        name: `Copy perf ${label} customized LC`,
        level: TemplateLevel.SITE,
        selectedBundleIds: dense.selectedBundleIds.slice(0, 1),
        selectedActivityIds: [
          ...new Set(customPermissions.map(permission => permission.activityId)),
        ],
        permissions: customPermissions,
      };
      const customCopy = await service.copyTemplateWithData(
        context.source.id,
        customized,
        healthAuthority,
      );
      await assertCopy(context, customCopy.id, customized, healthAuthority);
      await cleanupOwned(context, false);
      output.rollback = {
        injectedPermissionBatch: 2,
        permissions: dto.permissions.length,
        orphans,
        sameNameRetry: true,
        exactReadback: true,
      };
      output.customized = {
        catalogueLc: true,
        normalizedRestriction: true,
        inheritedLegacyLc: lc.length,
        level: TemplateLevel.SITE,
        exactRelations: true,
        exactReadback: true,
      };
    }
    writeJson(outputFile, output);
    report({ complete: true, output: outputFile, rollback: output.rollback });
  } finally {
    profiler.restore();
    await context.close();
  }
}

if (require.main === module) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      rollback: { type: 'boolean', default: false },
      'http-url': { type: 'string' },
      output: { type: 'string' },
      'full-wizard-only': { type: 'boolean', default: false },
    },
  });
  benchmark(
    positionals[0],
    Number(positionals[1] ?? 30),
    values.rollback,
    values['http-url'],
    values.output,
    values['full-wizard-only'],
  ).catch(failSafely);
}
