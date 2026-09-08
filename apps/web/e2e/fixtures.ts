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
