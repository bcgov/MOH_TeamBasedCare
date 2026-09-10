import { expect, Page } from '@playwright/test';

/**
 * Shared helpers for the planning e2e specs.
 *
 * These run against the real Next dev server in Chrome, with the API stubbed and
 * auth seeded into localStorage, so no backend or Keycloak login is required.
 */

const ONE_HOUR = 60 * 60 * 1000;

export interface StubSession {
  id: string;
  name: string;
  careSetting: { id: string; name: string } | null;
  updatedAt: string;
  createdAt: string;
}

export const buildSessions = (): StubSession[] => [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Emergency Department Plan',
    careSetting: { id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', name: 'Emergency Department' },
    updatedAt: '2026-01-15T10:30:00.000Z',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Intensive Care Unit Plan',
    careSetting: { id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', name: 'Intensive Care Unit' },
    updatedAt: '2026-01-16T12:00:00.000Z',
    createdAt: '2026-01-11T08:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Ambulatory Care Plan',
    careSetting: { id: 'cccccccc-3333-4333-8333-cccccccccccc', name: 'Ambulatory Care' },
    updatedAt: '2026-01-17T09:00:00.000Z',
    createdAt: '2026-01-12T08:00:00.000Z',
  },
];

const NAME_MIN = 10;
const NAME_MAX = 100;

/**
 * Mirrors the server-side rename rules so the browser sees realistic responses:
 * trimmed length bounds, and case/whitespace-insensitive uniqueness per owner.
 */
function validateRename(sessions: StubSession[], id: string, rawName: unknown) {
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (name.length < NAME_MIN) {
    return { error: `Name must be at least ${NAME_MIN} characters.` };
  }
  if (name.length > NAME_MAX) {
    return { error: `Name must be at most ${NAME_MAX} characters.` };
  }
  const clash = sessions.some(
    s => s.id !== id && s.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (clash) {
    return { error: 'A planning session with this name already exists.' };
  }
  return { name };
}

export interface ApiStub {
  sessions: StubSession[];
  deleted: string[];
  renames: { id: string; name: string }[];
  /** When set, GET /sessions/last_draft returns this session instead of null */
  lastDraft: StubSession | null;
  created: StubSession[];
}

export async function stubApi(page: Page, initial = buildSessions()): Promise<ApiStub> {
  const stub: ApiStub = {
    sessions: [...initial],
    deleted: [],
    renames: [],
    lastDraft: null,
    created: [],
  };

  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path.includes('/auth/user')) {
      return json({
        id: 'e2e@example.com',
        email: 'e2e@example.com',
        roles: ['ADMIN'],
        status: 'ACTIVE',
      });
    }

    if (path.endsWith('/sessions/find')) {
      const searchText = (url.searchParams.get('searchText') ?? '').trim().toLowerCase();
      // The client sends `sortBy` and `page` (see appendQueryParams in request-method.ts).
      const sortKey = url.searchParams.get('sortBy');
      const sortOrder = url.searchParams.get('sortOrder');
      const pageIndex = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 10);

      let rows = stub.sessions.filter(s => s.name.toLowerCase().includes(searchText));

      if (sortKey && sortOrder) {
        const dir = sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          const pick = (s: StubSession) =>
            sortKey === 'careSettingName'
              ? s.careSetting?.name ?? ''
              : String((s as never)[sortKey]);
          return pick(a).localeCompare(pick(b)) * dir;
        });
      }

      const total = rows.length;
      const start = (pageIndex - 1) * pageSize;
      return json({ result: rows.slice(start, start + pageSize), total });
    }

    // POST /sessions -- create a draft from the Profile stage
    if (path.endsWith('/sessions') && method === 'POST') {
      const body = (request.postDataJSON() ?? {}) as { careLocation?: string };
      const careSetting =
        stub.sessions.map(s => s.careSetting).find(cs => cs?.id === body.careLocation) ?? null;
      const now = new Date().toISOString();
      const session: StubSession = {
        id: `created-${stub.created.length + 1}`,
        name: `Untitled draft ${stub.created.length + 1}`,
        careSetting,
        updatedAt: now,
        createdAt: now,
      };
      stub.created.push(session);
      stub.sessions.push(session);
      return json(session);
    }

    // PATCH /sessions/:id/profile
    if (/\/sessions\/[^/]+\/profile$/.test(path) && method === 'PATCH') {
      return json({ success: true });
    }

    // PATCH /sessions/:id/name
    const renameMatch = path.match(/\/sessions\/([^/]+)\/name$/);
    if (renameMatch && method === 'PATCH') {
      const id = renameMatch[1];
      const body = request.postDataJSON() as { name?: string };
      const outcome = validateRename(stub.sessions, id, body?.name);

      if ('error' in outcome) {
        return json({ message: outcome.error, statusCode: 400 }, 400);
      }

      const session = stub.sessions.find(s => s.id === id);
      if (session) session.name = outcome.name;
      stub.renames.push({ id, name: outcome.name });
      return json({ id, name: outcome.name });
    }

    // DELETE /sessions/:id
    const deleteMatch = path.match(/\/sessions\/([^/]+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];
      stub.sessions = stub.sessions.filter(s => s.id !== id);
      stub.deleted.push(id);
      return json({ success: true });
    }

    if (path.includes('/sessions/last_draft')) {
      if (!stub.lastDraft) return json(null);

      const { id, name, careSetting, updatedAt } = stub.lastDraft;
      return json({ id, name, careSetting, updatedAt, profileOption: 'draft', bundles: [] });
    }
    if (path.includes('/care-setting-templates')) {
      return json(
        stub.sessions
          .map(s => s.careSetting)
          .filter(Boolean)
          .map(cs => ({ id: cs!.id, name: cs!.name, isMaster: false })),
      );
    }

    return json({ result: [], total: 0 });
  });

  return stub;
}

export async function seedAuth(page: Page) {
  const expiry = Date.now() + ONE_HOUR;
  // Structurally valid but unsigned; the client only decodes the payload.
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ iss: 'tbcm-e2e' })}.sig`;

  await page.addInitScript(
    ([tokenValue, expiryValue]) => {
      window.localStorage.setItem(
        'tbcm',
        JSON.stringify({
          accessToken: tokenValue,
          accessTokenExpiry: expiryValue,
          refreshToken: tokenValue,
          refreshTokenExpiry: expiryValue,
          tokensLastRefreshedAt: Date.now(),
          email: 'e2e@example.com',
          id: 'e2e@example.com',
        }),
      );
    },
    [token, expiry] as const,
  );
}

/** Uncaught errors. React error boundaries swallow render errors, so pair with the overlay check. */
export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

/** Next's dev overlay is how a caught render error surfaces in the browser. */
export async function expectNoRuntimeOverlay(page: Page) {
  await expect(page.getByRole('dialog', { name: /Runtime .*Error/i })).toHaveCount(0);
}

/* ------------------------------------------------------------------------- *
 * Care setting template stubs (feature 002 — template levels)
 *
 * Added alongside the planning stubs rather than replacing them, so the
 * inherited planning specs keep working unchanged.
 * ------------------------------------------------------------------------- */

export interface StubTemplate {
  id: string;
  name: string;
  isMaster: boolean;
  level: 'health authority' | 'site' | null;
  parentId: string | null;
  parentName: string | null;
  healthAuthority: string | null;
  version: number;
  updatedAt: string;
}

export interface StubPermission {
  activityId: string;
  occupationId: string;
  permission: 'Y' | 'N' | 'LC';
  limitId?: string | null;
  limitName?: string | null;
  restrictionDescription?: string | null;
}

const PROVINCIAL_LABEL = 'Provincial';
const HA_LABEL = 'Health Authority';
const SITE_LABEL = 'Site / Care Settings';

const levelLabelOf = (t: StubTemplate) =>
  t.isMaster ? PROVINCIAL_LABEL : t.level === 'health authority' ? HA_LABEL : SITE_LABEL;

export const buildTemplates = (): StubTemplate[] => [
  {
    id: 'tpl-master',
    name: 'Provincial Medical Unit',
    isMaster: true,
    level: null,
    parentId: null,
    parentName: null,
    healthAuthority: null,
    version: 0,
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tpl-ha',
    name: 'Island Health Medical Unit',
    isMaster: false,
    level: 'health authority',
    parentId: 'tpl-master',
    parentName: 'Provincial Medical Unit',
    healthAuthority: 'Island Health',
    version: 3,
    updatedAt: '2026-01-12T08:00:00.000Z',
  },
  {
    id: 'tpl-site',
    name: 'Victoria General Medical Unit',
    isMaster: false,
    level: 'site',
    parentId: 'tpl-ha',
    parentName: 'Island Health Medical Unit',
    healthAuthority: 'Island Health',
    version: 1,
    updatedAt: '2026-01-14T08:00:00.000Z',
  },
];

export const STUB_LIMITS = [
  { id: 'limit-1', name: 'Additional Training', description: null },
  { id: 'limit-2', name: 'Additional Education', description: null },
  { id: 'limit-3', name: 'Certification', description: null },
];

const STUB_BUNDLE = {
  id: 'bundle-1',
  name: 'Assessment',
  displayName: 'Assessment',
  careActivities: [
    { id: 'activity-1', name: 'Initial assessment', displayName: 'Initial assessment' },
    { id: 'activity-2', name: 'Vital signs', displayName: 'Vital signs' },
  ],
};

const STUB_OCCUPATIONS = [
  { id: 'occ-1', name: 'Registered Nurse', displayName: 'Registered Nurse' },
  { id: 'occ-2', name: 'Licensed Practical Nurse', displayName: 'Licensed Practical Nurse' },
];

export interface CareSettingsStub {
  templates: StubTemplate[];
  /** Permissions per template id. */
  permissions: Record<string, StubPermission[]>;
  /** Selected bundle IDs per template id. */
  selectedBundleIds: Record<string, string[]>;
  /** Selected activity IDs per template id. */
  selectedActivityIds: Record<string, string[]>;
  /** Bodies received by the two save endpoints, for asserting what was sent. */
  saves: { id: string; body: any }[];
  detailSaves: { id: string; body: any }[];
  copies: any[];
  /**
   * When set, the next matching save is answered with a 409 carrying this
   * payload. Cleared after it fires so a retry can succeed.
   */
  nextConflict: { currentVersion: number; updatedBy?: string; updatedAt?: string } | null;
}

/**
 * The API wraps every handled error through `ErrorExceptionFilter`, so a 409
 * reaches the client as `{ errorType, errorMessage, errorDetails }`. Stubbing
 * the raw payload instead would let a client that cannot read the real shape
 * pass its tests.
 */
const conflictBody = (payload: {
  currentVersion: number;
  updatedBy?: string;
  updatedAt?: string;
}) => ({
  errorType: 'TemplateVersionConflict',
  errorMessage: 'This template was changed by someone else. Nothing has been saved.',
  errorDetails: payload,
});

export async function stubCareSettings(
  page: Page,
  initial: StubTemplate[] = buildTemplates(),
): Promise<CareSettingsStub> {
  const stub: CareSettingsStub = {
    templates: [...initial],
    permissions: {
      'tpl-master': [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
      'tpl-ha': [
        { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
        {
          activityId: 'activity-2',
          occupationId: 'occ-1',
          permission: 'LC',
          limitId: 'limit-2',
          limitName: STUB_LIMITS[1].name,
          restrictionDescription: 'Nights only',
        },
      ],
      'tpl-site': [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
    },
    selectedBundleIds: Object.fromEntries(initial.map(template => [template.id, [STUB_BUNDLE.id]])),
    selectedActivityIds: Object.fromEntries(
      initial.map(template => [
        template.id,
        STUB_BUNDLE.careActivities.map(activity => activity.id),
      ]),
    ),
    saves: [],
    detailSaves: [],
    copies: [],
    nextConflict: null,
  };

  await page.route('**/api/v1/care-settings/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path.endsWith('/care-settings/cms/limits-conditions')) {
      return json(STUB_LIMITS);
    }

    if (path.endsWith('/care-settings/cms/find')) {
      const searchText = (url.searchParams.get('searchText') ?? '').trim().toLowerCase();
      const level = url.searchParams.get('level') ?? 'all';

      let rows = stub.templates.filter(t => t.name.toLowerCase().includes(searchText));
      if (level === 'provincial') rows = rows.filter(t => t.isMaster);
      else if (level !== 'all') rows = rows.filter(t => !t.isMaster && t.level === level);

      return json({
        result: rows.map(t => ({ ...t, levelLabel: levelLabelOf(t) })),
        total: rows.length,
      });
    }

    const parentMatch = path.match(/\/care-settings\/([^/]+)\/parent-permissions$/);
    if (parentMatch) {
      const template = stub.templates.find(t => t.id === parentMatch[1]);
      if (!template?.parentId) return json([]);
      return json(
        (stub.permissions[template.parentId] ?? []).map(p => ({
          activityId: p.activityId,
          occupationId: p.occupationId,
          permission: p.permission,
        })),
      );
    }

    if (/\/care-settings\/[^/]+\/bundles$/.test(path)) {
      return json([STUB_BUNDLE]);
    }

    if (/\/care-settings\/[^/]+\/occupations$/.test(path)) {
      return json(STUB_OCCUPATIONS);
    }

    const copyDataMatch = path.match(/\/care-settings\/([^/]+)\/copy-data$/);
    if (copyDataMatch) {
      const template = stub.templates.find(t => t.id === copyDataMatch[1]);
      return json({
        id: template?.id,
        name: template?.name,
        unitId: 'unit-1',
        selectedBundleIds: [STUB_BUNDLE.id],
        selectedActivityIds: STUB_BUNDLE.careActivities.map(a => a.id),
        permissions: stub.permissions[copyDataMatch[1]] ?? [],
      });
    }

    const copyFullMatch = path.match(/\/care-settings\/([^/]+)\/copy-full$/);
    if (copyFullMatch && method === 'POST') {
      const body = request.postDataJSON();
      stub.copies.push({ sourceId: copyFullMatch[1], body });
      const created: StubTemplate = {
        id: `tpl-copy-${stub.copies.length}`,
        name: body.name,
        isMaster: false,
        level: body.level ?? 'site',
        parentId: copyFullMatch[1],
        parentName: stub.templates.find(t => t.id === copyFullMatch[1])?.name ?? null,
        healthAuthority: 'Island Health',
        version: 0,
        updatedAt: new Date().toISOString(),
      };
      stub.templates.push(created);
      return json(created);
    }

    const detailsMatch = path.match(/\/care-settings\/([^/]+)\/details$/);
    if (detailsMatch && method === 'PATCH') {
      const id = detailsMatch[1];
      const body = request.postDataJSON();

      if (stub.nextConflict) {
        const conflict = stub.nextConflict;
        stub.nextConflict = null;
        return json(conflictBody(conflict), 409);
      }

      stub.detailSaves.push({ id, body });
      const template = stub.templates.find(t => t.id === id);
      if (template) {
        template.name = body.name;
        template.level = body.level;
        template.version += 1;
      }
      return json({ ...template, levelLabel: template ? levelLabelOf(template) : '' });
    }

    const idMatch = path.match(/\/care-settings\/([^/]+)$/);
    if (idMatch && method === 'PATCH') {
      const id = idMatch[1];
      const body = request.postDataJSON();

      if (stub.nextConflict) {
        const conflict = stub.nextConflict;
        stub.nextConflict = null;
        return json(conflictBody(conflict), 409);
      }

      stub.saves.push({ id, body });
      const template = stub.templates.find(t => t.id === id);
      if (template) {
        template.name = body.name;
        template.version += 1;
      }
      if (body.changes) {
        const changes = body.changes;
        const permissions = new Map(
          (stub.permissions[id] ?? []).map(permission => [
            `${permission.activityId}::${permission.occupationId}`,
            permission,
          ]),
        );
        changes.permissionUpserts.forEach((permission: StubPermission) => {
          permissions.set(`${permission.activityId}::${permission.occupationId}`, permission);
        });
        changes.permissionRemovals.forEach(
          (permission: Pick<StubPermission, 'activityId' | 'occupationId'>) => {
            permissions.delete(`${permission.activityId}::${permission.occupationId}`);
          },
        );
        stub.permissions[id] = Array.from(permissions.values());

        const applySelectionChanges = (
          current: string[],
          added: string[],
          removed: string[],
        ): string[] =>
          Array.from(new Set([...current.filter(value => !removed.includes(value)), ...added]));

        stub.selectedBundleIds[id] = applySelectionChanges(
          stub.selectedBundleIds[id] ?? [],
          changes.selectedBundleIdsToAdd,
          changes.selectedBundleIdsToRemove,
        );
        stub.selectedActivityIds[id] = applySelectionChanges(
          stub.selectedActivityIds[id] ?? [],
          changes.selectedActivityIdsToAdd,
          changes.selectedActivityIdsToRemove,
        );
      } else {
        stub.permissions[id] = body.permissions ?? [];
        stub.selectedBundleIds[id] = body.selectedBundleIds ?? [];
        stub.selectedActivityIds[id] = body.selectedActivityIds ?? [];
      }
      return json({ success: true });
    }

    if (idMatch && method === 'GET') {
      const template = stub.templates.find(t => t.id === idMatch[1]);
      if (!template) return json({ message: 'Not found' }, 404);

      return json({
        ...template,
        levelLabel: levelLabelOf(template),
        selectedBundles: (stub.selectedBundleIds[template.id] ?? []).map(bundleId => ({
          bundleId,
          selectedActivityIds: (stub.selectedActivityIds[template.id] ?? []).filter(activityId =>
            STUB_BUNDLE.careActivities.some(activity => activity.id === activityId),
          ),
        })),
        permissions: stub.permissions[template.id] ?? [],
      });
    }

    return json({ result: [], total: 0 });
  });

  return stub;
}
