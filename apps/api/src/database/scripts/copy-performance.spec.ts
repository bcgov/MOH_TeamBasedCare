import {
  assertLocalTarget,
  cleanupOwned,
  connectLocal,
  fingerprint,
  LocalContext,
  MASTER_NAME,
  PREVIEW,
  readPreview,
  report,
  ROOT,
  templateFingerprint,
  writeJson,
} from './copy-performance-local';
import { seed } from './seed-care-setting-copy-performance';
import {
  authenticatedHttp,
  benchmark,
  finalizeHttpOwnership,
  fullWizardSnapshot,
  queryPhase,
  sqlWallDuration,
  summary,
} from './benchmark-care-setting-copy';
import { DataSource } from 'typeorm';
import childProcess = require('node:child_process');
import fs = require('node:fs');
import { BadRequestException } from '@nestjs/common';
import { CareSettingTemplateService } from '../../unit/care-setting-template.service';
import { CreateCareSettingTemplateCopyFullDTO, TemplateLevel } from '@tbcm/common';

const wizardData = () => ({
  id: 'source-id',
  name: 'Master',
  unitId: 'unit-id',
  selectedBundleIds: ['bundle-id'],
  selectedActivityIds: ['selected-activity'],
  permissions: [
    {
      activityId: 'selected-activity',
      occupationId: 'active-occupation',
      permission: 'Y',
      limitId: null,
      restrictionDescription: null,
    },
    {
      activityId: 'unselected-activity',
      occupationId: 'deleted-occupation',
      permission: 'LC',
      limitId: null,
      restrictionDescription: 'Inherited detail',
    },
    {
      activityId: 'omitted-activity',
      occupationId: 'active-occupation',
      permission: 'N',
      limitId: null,
      restrictionDescription: null,
    },
  ],
});

jest.mock('./copy-performance-local', () => ({
  ...jest.requireActual('./copy-performance-local'),
  connectLocal: jest.fn(),
  writeJson: jest.fn(),
  report: jest.fn(),
  readPreview: jest.fn(),
  cleanupOwned: jest.fn(),
  templateFingerprint: jest.fn(),
}));

function mockDurableWrites(): void {
  jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
  jest.spyOn(fs, 'openSync').mockReturnValue(100);
  jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);
  jest.spyOn(fs, 'fsyncSync').mockReturnValue(undefined);
  jest.spyOn(fs, 'closeSync').mockReturnValue(undefined);
  jest.spyOn(fs, 'renameSync').mockReturnValue(undefined);
}

describe('local copy performance safeguards', () => {
  it('keeps unselected activities, unresolved references, and LC details in a full wizard snapshot', () => {
    const data = wizardData();
    const snapshot = fullWizardSnapshot(data);
    expect(snapshot.permissions).toEqual(data.permissions.slice(0, 2));
    expect(snapshot.selectedActivityIds).toEqual(['selected-activity']);
    expect(data.permissions).toHaveLength(3);
  });

  it.each(['production', 'test', 'development', undefined])('rejects runtime %s', NODE_ENV => {
    expect(() => assertLocalTarget({ NODE_ENV, POSTGRES_HOST: '127.0.0.1' })).toThrow(
      'NODE_ENV=local',
    );
  });

  it.each(['db', 'dev.example.com', '10.0.0.1', '127.0.0.2', undefined])(
    'rejects host %s',
    POSTGRES_HOST => {
      expect(() => assertLocalTarget({ NODE_ENV: 'local', POSTGRES_HOST })).toThrow('loopback');
    },
  );

  it.each(['localhost', '127.0.0.1', '::1'])(
    'allows explicit loopback %s for subsequent Docker verification',
    POSTGRES_HOST => {
      expect(() => assertLocalTarget({ NODE_ENV: 'local', POSTGRES_HOST })).not.toThrow();
    },
  );

  it.each(['DATABASE_URL', 'PGHOSTADDR', 'PGSERVICE'])('rejects alternate routing %s', setting => {
    expect(() =>
      assertLocalTarget({ NODE_ENV: 'local', POSTGRES_HOST: 'localhost', [setting]: 'set' }),
    ).toThrow('routing');
  });

  it('uses nearest-rank p95 without dropping the slowest warm tail', () => {
    expect(summary(Array.from({ length: 30 }, (_, index) => index + 1))).toEqual({
      median: 15.5,
      p95: 29,
      min: 1,
      max: 30,
    });
  });

  it('does not double-count overlapping or nested query durations', () => {
    expect(
      sqlWallDuration([
        [10, 20],
        [5, 15],
        [8, 9],
        [25, 30],
      ]),
    ).toBe(20);
    expect(
      sqlWallDuration([
        [1, 3],
        [3, 5],
      ]),
    ).toBe(4);
    expect(sqlWallDuration([])).toBe(0);
  });

  it.each([
    ['SELECT id FROM occupation', 'referenceRead'],
    ['INSERT INTO "care_setting_template"("id") VALUES (DEFAULT)', 'templateWrite'],
    ['INSERT INTO care_setting_template_permission VALUES ($1)', 'permissionWrite'],
    ['INSERT INTO "care_setting_template_activities" VALUES ($1)', 'relationWrite'],
    ['COMMIT', 'transaction'],
  ])('classifies SQL without retaining it or its values', (sql, phase) => {
    expect(queryPhase(sql)).toBe(phase);
  });
});

describe('full-wizard invalid-reference diagnostic', () => {
  afterEach(() => jest.restoreAllMocks());

  it('submits all non-N rows and records explicit 400/no-copy rather than filtering invalid rows', async () => {
    jest.clearAllMocks();
    (cleanupOwned as jest.Mock).mockResolvedValue(undefined);
    const query = jest.fn(async (sql: string) => {
      if (sql.startsWith('SELECT id FROM occupation'))
        return [{ id: 'active-occupation' }, { id: 'other-active-occupation' }];
      if (sql.includes('FROM unnest'))
        return [
          {
            invalidPermissionPairs: 1,
            missingActivities: 0,
            missingOccupations: 0,
            deletedOccupations: 1,
          },
        ];
      if (sql.includes('FROM care_setting_template')) return [{ count: 0 }];
      throw new Error('Unexpected diagnostic query');
    });
    const close = jest.fn();
    (connectLocal as jest.Mock).mockResolvedValue({
      runner: { query },
      dataSource: { createQueryRunner: jest.fn(), getRepository: jest.fn().mockReturnValue({}) },
      source: { id: 'source-id' },
      ownership: { permissions: [], templates: [] },
      close,
    });
    const data = wizardData();
    data.permissions[2].activityId = 'selected-activity';
    data.permissions[2].occupationId = 'other-active-occupation';
    jest.spyOn(CareSettingTemplateService.prototype, 'getTemplateForCopy').mockResolvedValue(data);
    const copy = jest
      .spyOn(CareSettingTemplateService.prototype, 'copyTemplateWithData')
      .mockRejectedValue(new BadRequestException('Unavailable occupation'));
    await benchmark('full-wizard-test', 1, false, undefined, undefined, true);
    expect(copy).toHaveBeenCalledTimes(2);
    for (const [, dto] of copy.mock.calls)
      expect(dto.permissions).toEqual(wizardData().permissions.slice(0, 2));
    expect(writeJson).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        dataset: expect.objectContaining({
          scope: 'full-wizard snapshot: all returned non-N entries',
          permissions: 2,
        }),
        results: expect.objectContaining({
          fullWizard: expect.objectContaining({
            outcome: 'explicit 400: invalid/deleted references; no copy',
          }),
        }),
      }),
    );
    expect(
      query.mock.calls.filter(([sql]) => sql.includes('FROM care_setting_template')),
    ).toHaveLength(2);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

describe('Docker identity verification', () => {
  const actual = jest.requireActual(
    './copy-performance-local',
  ) as typeof import('./copy-performance-local');
  const environment = process.env;

  afterEach(() => {
    process.env = environment;
    jest.restoreAllMocks();
  });

  it('rejects a different server cluster even on the Docker-published loopback port', async () => {
    process.env = { NODE_ENV: 'local', POSTGRES_HOST: '127.0.0.1', POSTGRES_PORT: '5432' };
    jest
      .spyOn(childProcess, 'execFileSync')
      .mockReturnValueOnce('unix:///local/docker.sock')
      .mockReturnValueOnce(
        JSON.stringify({
          running: true,
          image: 'postgres:15-alpine',
          ports: { '5432/tcp': [{ HostPort: '5432' }] },
          networks: { local: { IPAddress: '172.21.0.2', GlobalIPv6Address: '' } },
        }),
      )
      .mockReturnValueOnce('/local/postgres/data')
      .mockReturnValueOnce('Database system identifier: 1234');
    const release = jest.fn().mockResolvedValue(undefined);
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        { cluster: 'different-cluster', address: '172.21.0.2', port: 5432, database: 'tbcm' },
      ]);
    jest.spyOn(DataSource.prototype, 'initialize').mockImplementation(async function (
      this: DataSource,
    ) {
      Object.assign(this, { isInitialized: true });
      return this;
    });
    jest.spyOn(DataSource.prototype, 'createQueryRunner').mockReturnValue({
      connect: jest.fn(),
      query,
      release,
    } as unknown as ReturnType<DataSource['createQueryRunner']>);
    const destroy = jest.spyOn(DataSource.prototype, 'destroy').mockResolvedValue(undefined);
    await expect(actual.connectLocal()).rejects.toThrow('not the verified local Docker database');
    expect(query).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('rejects a port not published by the local container before opening a database connection', async () => {
    process.env = { NODE_ENV: 'local', POSTGRES_HOST: '127.0.0.1', POSTGRES_PORT: '15432' };
    jest
      .spyOn(childProcess, 'execFileSync')
      .mockReturnValueOnce('unix:///local/docker.sock')
      .mockReturnValueOnce(
        JSON.stringify({
          running: true,
          image: 'postgres:15-alpine',
          ports: { '5432/tcp': [{ HostPort: '5432' }] },
          networks: {},
        }),
      );
    const initialize = jest.spyOn(DataSource.prototype, 'initialize');
    await expect(actual.connectLocal()).rejects.toThrow('not published directly');
    expect(initialize).not.toHaveBeenCalled();
  });

  it('rejects remote Docker contexts even when the database host is loopback', async () => {
    process.env = { NODE_ENV: 'local', POSTGRES_HOST: '127.0.0.1' };
    jest.spyOn(childProcess, 'execFileSync').mockReturnValueOnce('ssh://remote-daemon');
    const initialize = jest.spyOn(DataSource.prototype, 'initialize');
    await expect(actual.connectLocal()).rejects.toThrow('remote Docker contexts/tunnels');
    expect(initialize).not.toHaveBeenCalled();
  });
});

describe('ownership cleanup refusal', () => {
  const actual = jest.requireActual(
    './copy-performance-local',
  ) as typeof import('./copy-performance-local');

  afterEach(() => jest.restoreAllMocks());

  it('checks permission dependents once per batch, not once per row', async () => {
    mockDurableWrites();
    const permissions = Array.from({ length: 1001 }, (_, index) => ({
      id: `owned-${index}`,
      fingerprint: fingerprint({ permission: 'Y' }),
    }));
    const query = jest.fn(async (sql: string, parameters?: string[][]) =>
      sql.startsWith('SELECT id, to_jsonb(p)')
        ? parameters![0].map(id => ({ id, row: { permission: 'Y' } }))
        : [],
    );
    const context = {
      runner: {
        query,
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        isTransactionActive: true,
      },
      ownership: { templates: [], permissions },
    } as unknown as Awaited<ReturnType<typeof connectLocal>>;
    await actual.cleanupOwned(context, true);
    expect(query.mock.calls.filter(([sql]) => sql.includes('FROM pg_constraint'))).toHaveLength(2);
    expect(query.mock.calls.filter(([sql]) => sql.startsWith('DELETE'))).toHaveLength(2);
    expect(context.ownership.permissions).toEqual([]);
  });

  it('preserves other owned templates when cleaning an exact probe ID', async () => {
    mockDurableWrites();
    const probe = { template: { id: 'probe-id' }, permissions: [], bundles: [], activities: [] };
    const retained = { id: 'other-owned-id', fingerprint: 'other-hash' };
    const query = jest.fn(async (sql: string) =>
      sql.startsWith('SELECT to_jsonb(t)') ? [probe] : [],
    );
    const context = {
      runner: {
        query,
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        isTransactionActive: true,
      },
      ownership: {
        templates: [{ id: 'probe-id', fingerprint: fingerprint(probe) }, retained],
        permissions: [],
      },
    } as unknown as Awaited<ReturnType<typeof connectLocal>>;
    await actual.cleanupOwned(context, false, ['probe-id']);
    expect(query).toHaveBeenCalledWith('DELETE FROM care_setting_template WHERE id = $1', [
      'probe-id',
    ]);
    expect(context.ownership.templates).toEqual([retained]);
  });

  it('rolls back rather than deleting an edited owned permission', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'owned-id', row: { permission: 'LC' } }]);
    const runner = {
      query,
      startTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      isTransactionActive: true,
    };
    const context = {
      runner,
      ownership: {
        templates: [],
        permissions: [{ id: 'owned-id', fingerprint: fingerprint({ permission: 'Y' }) }],
      },
    } as unknown as Awaited<ReturnType<typeof connectLocal>>;
    await expect(actual.cleanupOwned(context, true)).rejects.toThrow(
      'Owned fixture permission changed',
    );
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.some(([sql]) => sql.startsWith('DELETE'))).toBe(false);
  });

  it('refuses a copy now used by an unexpected dependent', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { table: 'planning_session', column: 'care_setting_template_id', columns: 1 },
      ])
      .mockResolvedValueOnce([{ exists: 1 }]);
    const runner = {
      query,
      startTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      isTransactionActive: true,
    };
    const context = {
      runner,
      ownership: { templates: [{ id: 'copy-id', fingerprint: 'unchanged' }], permissions: [] },
    } as unknown as Awaited<ReturnType<typeof connectLocal>>;
    await expect(actual.cleanupOwned(context, false)).rejects.toThrow('unexpected dependents');
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.some(([sql]) => sql.startsWith('DELETE'))).toBe(false);
  });
});

describe('HTTP copy ownership finalization', () => {
  const actual = jest.requireActual(
    './copy-performance-local',
  ) as typeof import('./copy-performance-local');
  const dto: CreateCareSettingTemplateCopyFullDTO = {
    name: 'Owned copy',
    selectedBundleIds: [],
    selectedActivityIds: [],
    permissions: [],
  };
  let context: LocalContext;
  let template: {
    name: string;
    parent_id: string;
    unit_id: string;
    health_authority: string;
    level: TemplateLevel;
    is_master: boolean;
    version: number;
  };
  let locked: boolean;
  let attemptEdit: boolean;
  let editBlocked: boolean;
  const snapshot = () => ({
    template: { ...template },
    permissions: [],
    bundles: [],
    activities: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    locked = false;
    attemptEdit = false;
    editBlocked = false;
    const dataSource = new DataSource({ type: 'postgres' });
    const runner = dataSource.createQueryRunner();
    let transactionActive = false;
    Object.defineProperty(runner, 'isTransactionActive', { get: () => transactionActive });
    template = {
      name: dto.name,
      parent_id: 'source-id',
      unit_id: 'unit-id',
      health_authority: 'GLOBAL',
      level: TemplateLevel.HEALTH_AUTHORITY,
      is_master: false,
      version: 0,
    };
    jest.spyOn(runner, 'startTransaction').mockImplementation(async () => {
      transactionActive = true;
    });
    jest.spyOn(runner, 'commitTransaction').mockImplementation(async () => {
      transactionActive = false;
      locked = false;
    });
    jest.spyOn(runner, 'rollbackTransaction').mockImplementation(async () => {
      transactionActive = false;
      locked = false;
    });
    jest.spyOn(runner, 'query').mockImplementation(async (sql: string) => {
      if (sql.startsWith('LOCK TABLE')) {
        expect(runner.isTransactionActive).toBe(true);
        locked = true;
      }
      if (sql.startsWith('SELECT name, parent_id')) return [{ ...template }];
      if (sql.startsWith('SELECT to_jsonb(t)')) return [snapshot()];
      if (sql.startsWith('SELECT care_activity_id AS "activityId"') && attemptEdit) {
        editBlocked = locked;
        if (!locked) {
          template.name = 'Concurrent edit';
          template.version++;
        }
      }
      return [];
    });
    context = {
      dataSource,
      runner,
      source: {
        id: 'source-id',
        unit_id: 'unit-id',
        name: MASTER_NAME,
        is_master: true,
        level: null,
      },
      ownership: {
        format: 1,
        cluster: 'local-cluster',
        database: 'tbcm',
        sourceId: 'source-id',
        permissions: [],
        templates: [],
        pendingHttp: { name: dto.name, healthAuthority: 'GLOBAL', requestHash: fingerprint(dto) },
      },
      identity: {
        host: '127.0.0.1',
        port: 5432,
        database: 'tbcm',
        cluster: 'local-cluster',
        container: 'tbcm_db',
      },
      close: async () => {},
    };
    (templateFingerprint as jest.Mock).mockImplementation(async () => fingerprint(snapshot()));
  });

  afterEach(() => jest.restoreAllMocks());

  it('prevents edits between validation and fingerprinting, and refuses cleanup after a later edit', async () => {
    const expected = fingerprint(snapshot());
    attemptEdit = true;
    await finalizeHttpOwnership(context, 'copy-id', dto, 'GLOBAL');
    expect(editBlocked).toBe(true);
    expect(context.ownership.templates).toEqual([{ id: 'copy-id', fingerprint: expected }]);
    expect(context.ownership.pendingHttp).toBeUndefined();
    expect(context.runner.query).toHaveBeenCalledWith(
      expect.stringMatching(
        /LOCK TABLE care_setting_template, care_setting_template_permission,\s+care_setting_template_bundles, care_setting_template_activities IN SHARE ROW EXCLUSIVE MODE/,
      ),
    );
    template.name = 'Edit after finalization';
    template.version++;
    await expect(actual.cleanupOwned(context, false)).rejects.toThrow(
      'Owned benchmark copy changed',
    );
    expect(
      jest.mocked(context.runner.query).mock.calls.some(([sql]) => sql.startsWith('DELETE')),
    ).toBe(false);
  });

  it('retains pending ownership and rolls back if the copy changed before validation', async () => {
    const pending = context.ownership.pendingHttp;
    template.version = 1;
    await expect(finalizeHttpOwnership(context, 'copy-id', dto, 'GLOBAL')).rejects.toThrow();
    expect(context.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(context.runner.commitTransaction).not.toHaveBeenCalled();
    expect(context.ownership.pendingHttp).toEqual(pending);
    expect(context.ownership.templates).toEqual([]);
    expect(templateFingerprint).not.toHaveBeenCalled();
    expect(writeJson).not.toHaveBeenCalled();
  });

  it('retains pending ownership when fingerprinting fails', async () => {
    (templateFingerprint as jest.Mock).mockRejectedValueOnce(new Error('fingerprint failed'));
    await expect(finalizeHttpOwnership(context, 'copy-id', dto, 'GLOBAL')).rejects.toThrow(
      'fingerprint failed',
    );
    expect(context.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(context.ownership.pendingHttp).toBeDefined();
    expect(context.ownership.templates).toEqual([]);
    expect(writeJson).not.toHaveBeenCalled();
  });

  it('does not finalize in-memory ownership if the durable journal cannot be written', async () => {
    (writeJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    await expect(finalizeHttpOwnership(context, 'copy-id', dto, 'GLOBAL')).rejects.toThrow(
      'disk full',
    );
    expect(context.ownership.pendingHttp).toBeDefined();
    expect(context.ownership.templates).toEqual([]);
  });
});

describe('authenticated HTTP database probe', () => {
  const environment = process.env;
  let context: Awaited<ReturnType<typeof connectLocal>>;
  let query: jest.Mock;
  let commit: jest.Mock;
  let rollback: jest.Mock;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      COPY_BENCHMARK_BEARER_TOKEN: 'test-token',
      COPY_BENCHMARK_HEALTH_AUTHORITY: 'test-authority',
    };
    jest
      .spyOn(childProcess, 'execFileSync')
      .mockReturnValueOnce('p123\ncnode\n')
      .mockReturnValueOnce(`n${ROOT}/apps/api\n`);
    fetchMock = jest.spyOn(global, 'fetch');
    query = jest.fn().mockResolvedValue([]);
    commit = jest.fn().mockResolvedValue(undefined);
    rollback = jest.fn().mockResolvedValue(undefined);
    context = {
      runner: {
        query,
        startTransaction: jest.fn(),
        commitTransaction: commit,
        rollbackTransaction: rollback,
        isTransactionActive: true,
      },
      source: { id: 'source-id', unit_id: 'unit-id' },
      ownership: {
        templates: [{ id: 'earlier-owned-copy', fingerprint: 'old-hash' }],
        permissions: [],
      },
    } as unknown as Awaited<ReturnType<typeof connectLocal>>;
    (templateFingerprint as jest.Mock).mockResolvedValue('probe-hash');
    (cleanupOwned as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = environment;
    jest.restoreAllMocks();
  });

  function probeResponse(overrides: Record<string, unknown> = {}): Response {
    const [id, name] = query.mock.calls[0][1];
    return new Response(
      JSON.stringify({
        id,
        name,
        healthAuthority: 'GLOBAL',
        isMaster: false,
        ...overrides,
      }),
      { status: 200 },
    );
  }

  it('refuses POST before a probe and consumes authorization after one POST', async () => {
    const client = authenticatedHttp('http://127.0.0.1:4000');
    await expect(client.request('/care-settings/source-id/copy-full', '{}')).rejects.toThrow(
      'probe',
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockImplementationOnce(async () => probeResponse());
    await client.verifyDatabase(context);
    const [id, name] = query.mock.calls[0][1];
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(name).toMatch(/^Copy performance probe [0-9a-f-]{36}$/);
    expect(name.endsWith(id)).toBe(false);
    expect(query.mock.calls[0][0]).toContain("false, 'GLOBAL'");
    expect(context.ownership.templates).toContainEqual({
      id: 'earlier-owned-copy',
      fingerprint: 'old-hash',
    });
    expect((writeJson as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      commit.mock.invocationCallOrder[0],
    );
    expect(commit.mock.invocationCallOrder[0]).toBeLessThan(fetchMock.mock.invocationCallOrder[0]);
    expect(cleanupOwned).toHaveBeenCalledWith(context, false, [id]);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:4000/care-settings/${id}`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    fetchMock.mockResolvedValueOnce(new Response('{"id":"copy-id"}'));
    await client.request('/care-settings/source-id/copy-full', '{}');
    expect((cleanupOwned as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[1],
    );
    await expect(client.request('/care-settings/source-id/copy-full', '{}')).rejects.toThrow(
      'probe',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    { id: 'other-database-id' },
    { name: 'wrong-nonce' },
    { healthAuthority: 'not-global' },
  ])('rejects mismatched probe data and cleans only its exact owned ID', async override => {
    const client = authenticatedHttp('http://127.0.0.1:4000');
    fetchMock.mockImplementationOnce(async () => probeResponse(override));
    await expect(client.verifyDatabase(context)).rejects.toThrow('exact local database probe');
    expect(cleanupOwned).toHaveBeenCalledWith(context, false, [query.mock.calls[0][1][0]]);
    await expect(client.request('/copy-full', '{}')).rejects.toThrow('probe');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cleans the local probe and refuses writes when the API cannot resolve it', async () => {
    const client = authenticatedHttp('http://127.0.0.1:4000');
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(client.verifyDatabase(context)).rejects.toThrow('status 404');
    expect(cleanupOwned).toHaveBeenCalledWith(context, false, [query.mock.calls[0][1][0]]);
    await expect(client.request('/copy-full', '{}')).rejects.toThrow('probe');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rolls back and never calls the API when ownership journaling fails', async () => {
    const client = authenticatedHttp('http://127.0.0.1:4000');
    (writeJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    await expect(client.verifyDatabase(context)).rejects.toThrow('disk full');
    expect(rollback).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not authorize POST when probe cleanup fails', async () => {
    const client = authenticatedHttp('http://127.0.0.1:4000');
    fetchMock.mockImplementationOnce(async () => probeResponse());
    (cleanupOwned as jest.Mock).mockRejectedValueOnce(new Error('probe changed'));
    await expect(client.verifyDatabase(context)).rejects.toThrow('probe changed');
    await expect(client.request('/copy-full', '{}')).rejects.toThrow('probe');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('fixture journaling', () => {
  const existing = { id: 'old-owned-id', fingerprint: 'old-hash' };
  let context: {
    runner: {
      query: jest.Mock;
      startTransaction: jest.Mock;
      commitTransaction: jest.Mock;
      rollbackTransaction: jest.Mock;
      isTransactionActive: boolean;
    };
    ownership: { permissions: (typeof existing)[] };
    source: { id: string; name: string };
    close: jest.Mock;
  };
  const counts = {
    activities: 1,
    occupations: 2,
    stored: 1,
    covered: 1,
    bundles: 1,
    lc: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    context = {
      runner: {
        query: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        isTransactionActive: false,
      },
      ownership: { permissions: [existing] },
      source: { id: 'master-id', name: MASTER_NAME },
      close: jest.fn(),
    };
    (connectLocal as jest.Mock).mockResolvedValue(context);
    (readPreview as jest.Mock).mockReturnValue(
      fingerprint({
        identity: undefined,
        source: context.source,
        counts,
      }),
    );
  });

  it('dry-run reports the matrix without inserting or modifying ownership', async () => {
    context.runner.query.mockResolvedValueOnce([counts]);
    await seed('dry-run');
    expect(context.runner.query).toHaveBeenCalledTimes(1);
    expect(context.runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(writeJson).toHaveBeenCalledWith(PREVIEW, { signature: expect.any(String) });
    expect(context.ownership.permissions).toEqual([existing]);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ missing: 1, expected: 2 }));
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it('journals exact inserted IDs before commit and retains earlier ownership', async () => {
    const row = { id: 'new-id', permission: 'Y', created_at: 'timestamp' };
    context.runner.query
      .mockResolvedValueOnce([counts])
      .mockResolvedValueOnce([{ id: row.id, row }])
      .mockResolvedValueOnce([{ count: 2 }]);
    await seed('apply');
    expect(context.ownership.permissions).toEqual([
      existing,
      { id: row.id, fingerprint: fingerprint(row) },
    ]);
    expect((writeJson as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      context.runner.commitTransaction.mock.invocationCallOrder[0],
    );
    expect(context.runner.query.mock.calls[1][0]).toContain('NOT EXISTS');
    expect(context.runner.query.mock.calls[1][0]).toContain('LIMIT 5000');
    expect(context.runner.query.mock.calls[1][0]).not.toContain('ON CONFLICT');
  });

  it('idempotent reruns retain previous ownership and insert nothing', async () => {
    (readPreview as jest.Mock).mockReturnValue(
      fingerprint({
        identity: undefined,
        source: context.source,
        counts: { ...counts, covered: 2, stored: 2 },
      }),
    );
    context.runner.query
      .mockResolvedValueOnce([{ ...counts, covered: 2, stored: 2 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: 2 }]);
    await seed('apply');
    expect(context.ownership.permissions).toEqual([existing]);
    expect(report).toHaveBeenLastCalledWith({ inserted: 0, coverage: 2, owned: 1 });
  });

  it('does not commit when durable ownership cannot be written', async () => {
    context.runner.isTransactionActive = true;
    context.runner.query
      .mockResolvedValueOnce([counts])
      .mockResolvedValueOnce([{ id: 'new-id', row: {} }])
      .mockResolvedValueOnce([{ count: 2 }]);
    (writeJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    await expect(seed('apply')).rejects.toThrow('disk full');
    expect(context.runner.commitTransaction).not.toHaveBeenCalled();
    expect(context.runner.rollbackTransaction).toHaveBeenCalled();
  });

  it('requires a matching reviewed dry-run before applying', async () => {
    context.runner.query.mockResolvedValueOnce([counts]);
    (readPreview as jest.Mock).mockReturnValue('different-target-or-counts');
    await expect(seed('apply')).rejects.toThrow('dry-run');
    expect(context.runner.commitTransaction).not.toHaveBeenCalled();
    expect(writeJson).not.toHaveBeenCalled();
  });

  it('refuses implicit writes and insufficient base data', async () => {
    await expect(seed('')).rejects.toThrow('explicitly');
    expect(connectLocal).not.toHaveBeenCalled();
    context.runner.query.mockResolvedValueOnce([{ ...counts, activities: 0 }]);
    await expect(seed('apply')).rejects.toThrow('insufficient');
    expect(writeJson).not.toHaveBeenCalled();
  });
});
