/**
 * Limits state and the permission badge — UI cases 14, 14a, 14b, 15, 16.
 *
 * The reducer is exercised through the provider rather than in isolation,
 * because the rules being protected here are about how the wizard's permission
 * map and its limits map stay in step: a limit that outlives its LC permission
 * would be silently re-attached, and a badge that ignores the "absent means N"
 * convention would appear on every untouched cell in the grid.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Permissions } from '@tbcm/common';
import {
  CareSettingsProvider,
  useCareSettingsContext,
} from 'src/components/care-settings/CareSettingsContext';
import { Finalize } from 'src/components/care-settings/finalize';

jest.mock('src/services/useLimitConditions', () => ({
  useLimitsConditions: () => ({
    limits: [
      { id: 'limit-1', name: 'Certification' },
      { id: 'limit-2', name: 'Supervision' },
    ],
    isLoading: false,
    onRefresh: jest.fn(),
  }),
}));

const ACTIVITY = 'activity-1';
const OCCUPATION = 'occupation-1';
const KEY = `${ACTIVITY}::${OCCUPATION}`;

let ctx: ReturnType<typeof useCareSettingsContext>;

const Probe = () => {
  ctx = useCareSettingsContext();
  return <span data-testid='probe' />;
};

const renderWizard = () => {
  render(
    <CareSettingsProvider>
      <Probe />
    </CareSettingsProvider>,
  );
  return screen.getByTestId('probe');
};

const initialise = (payload: Parameters<typeof ctx.dispatch>[0] extends never ? never : any) =>
  act(() => {
    ctx.dispatch({ type: 'INITIALIZE_STATE', payload });
  });

describe('wizard limits state', () => {
  beforeEach(() => renderWizard());

  it('clears a cell\u2019s limit when its permission moves away from LC (UI case 14)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Only nights' }],
      ]),
    });

    expect(ctx.getPermissionLimit(ACTIVITY, OCCUPATION)).toEqual({
      limitId: 'limit-1',
      restrictionDescription: 'Only nights',
    });

    act(() => {
      ctx.dispatch({
        type: 'SET_PERMISSION',
        payload: {
          activityId: ACTIVITY,
          occupationId: OCCUPATION,
          permission: Permissions.PERFORM,
        },
      });
    });

    expect(ctx.getPermissionLimit(ACTIVITY, OCCUPATION)).toBeUndefined();
  });

  it('does not restore the previous limit when the cell returns to LC (UI case 14a)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
    });

    act(() => {
      ctx.dispatch({
        type: 'SET_PERMISSION',
        payload: { activityId: ACTIVITY, occupationId: OCCUPATION, permission: Permissions.NO },
      });
      ctx.dispatch({
        type: 'SET_PERMISSION',
        payload: { activityId: ACTIVITY, occupationId: OCCUPATION, permission: Permissions.LIMITS },
      });
    });

    expect(ctx.getPermissionLimit(ACTIVITY, OCCUPATION)).toBeUndefined();
  });

  it('emits an untouched legacy LC cell without a limit so it can still be saved (UI case 14b)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map(),
    });

    expect(ctx.getPermissionsArray()).toEqual([
      {
        activityId: ACTIVITY,
        occupationId: OCCUPATION,
        permission: Permissions.LIMITS,
        limitId: undefined,
        restrictionDescription: undefined,
      },
    ]);
  });

  it('attaches the limit to an LC entry and omits N entirely', () => {
    const otherKey = `${ACTIVITY}::occupation-2`;
    initialise({
      permissions: new Map([
        [KEY, Permissions.LIMITS],
        [otherKey, Permissions.NO],
      ]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Days only' }],
      ]),
    });

    expect(ctx.getPermissionsArray()).toEqual([
      {
        activityId: ACTIVITY,
        occupationId: OCCUPATION,
        permission: Permissions.LIMITS,
        limitId: 'limit-1',
        restrictionDescription: 'Days only',
      },
    ]);
  });
});

describe('parent comparison', () => {
  beforeEach(() => renderWizard());

  const parent = (permission: Permissions, extra: Record<string, unknown> = {}) =>
    new Map([[KEY, { permission, ...extra }]]);

  it('flags a Y/N cell whose permission differs from the parent (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.NO]]),
      hasParent: true,
      parentPermissions: parent(Permissions.PERFORM),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('changed');
    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(true);
  });

  it('leaves a cell matching the parent unflagged (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      hasParent: true,
      parentPermissions: parent(Permissions.PERFORM),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('none');
    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('treats a pair absent from both sides as N so an untouched cell is unflagged (UI case 16)', () => {
    initialise({
      permissions: new Map(),
      hasParent: true,
      parentPermissions: new Map([
        [`${ACTIVITY}::occupation-9`, { permission: Permissions.PERFORM }],
      ]),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('none');
  });

  it('flags a cell the parent does not have when this template permits it (UI case 16)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      hasParent: true,
      parentPermissions: new Map([
        [`${ACTIVITY}::occupation-9`, { permission: Permissions.PERFORM }],
      ]),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('changed');
  });

  it('never flags a Y/N cell on a template with no parent', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      hasParent: false,
      parentPermissions: new Map(),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('none');
    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('flags a permission added to a parent that has no permission rows', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      hasParent: true,
      parentPermissions: new Map(),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('changed');
  });

  it('reads an LC cell identical to the parent as unchanged', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Only nights' }],
      ]),
      hasParent: true,
      parentPermissions: parent(Permissions.LIMITS, {
        limitId: 'limit-1',
        restrictionDescription: 'Only nights',
      }),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-unchanged');
    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('ignores whitespace-only differences in the restriction description', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1', restrictionDescription: ' ' }]]),
      hasParent: true,
      parentPermissions: parent(Permissions.LIMITS, {
        limitId: 'limit-1',
        restrictionDescription: null,
      }),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-unchanged');
  });

  it('reads an LC cell with a different limit as changed', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-2' }]]),
      hasParent: true,
      parentPermissions: parent(Permissions.LIMITS, { limitId: 'limit-1' }),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-changed');
  });

  it('reads an LC cell with a different restriction description as changed', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Nights only' }],
      ]),
      hasParent: true,
      parentPermissions: parent(Permissions.LIMITS, {
        limitId: 'limit-1',
        restrictionDescription: 'Days only',
      }),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-changed');
  });

  it('reads an LC cell over a permitted parent as changed', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
      hasParent: true,
      parentPermissions: parent(Permissions.PERFORM),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-changed');
  });

  it('reads an LC cell with no parent as unchanged so it keeps its way into the dialog', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
      hasParent: false,
      parentPermissions: new Map(),
    });

    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-unchanged');
  });

  it.each([Permissions.PERFORM, Permissions.NO, Permissions.LIMITS])(
    'does not compare %s with an unavailable parent baseline',
    permission => {
      initialise({
        hasParent: true,
        permissions: new Map([[KEY, permission]]),
      });

      expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe(
        permission === Permissions.LIMITS ? 'lc-unavailable' : 'none',
      );
      expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
    },
  );

  it('distinguishes a successfully loaded empty baseline from an unavailable one', () => {
    initialise({
      hasParent: true,
      permissions: new Map([[KEY, Permissions.LIMITS]]),
    });

    act(() => ctx.dispatch({ type: 'SET_PARENT_PERMISSIONS', payload: new Map() }));
    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-changed');

    act(() => ctx.dispatch({ type: 'SET_PARENT_PERMISSIONS', payload: null }));
    expect(ctx.getParentComparison(ACTIVITY, OCCUPATION).kind).toBe('lc-unavailable');
  });
});

describe('permission badge rendering', () => {
  const BUNDLE = {
    id: 'bundle-1',
    name: 'Bundle One',
    careActivities: [{ id: ACTIVITY, name: 'Activity One' }],
  };
  const OCCUPATIONS = [{ id: OCCUPATION, name: 'Nurse' }];

  const renderFinalize = (payload: any) => {
    render(
      <CareSettingsProvider>
        <Probe />
        <Finalize />
      </CareSettingsProvider>,
    );

    act(() => {
      ctx.dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          bundles: [BUNDLE],
          occupations: OCCUPATIONS,
          selectedBundleIds: new Set([BUNDLE.id]),
          selectedActivityIds: new Set([ACTIVITY]),
          ...payload,
        },
      });
    });
  };

  /** The accordion is collapsed on first render, so the cell has to be revealed. */
  const openBundle = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Bundle One/ }));
  };

  // The tooltip opens on hover after a deliberate delay, which jsdom only gets
  // through with the timer advanced by hand.
  const hover = (element: HTMLElement) => {
    jest.useFakeTimers();
    fireEvent.mouseEnter(element);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    jest.useRealTimers();
    return screen.getByRole('tooltip');
  };

  it('shows an amber "Changes made" badge on a Y/N override', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.NO]]),
      hasParent: true,
      parentPermissions: new Map([[KEY, { permission: Permissions.PERFORM }]]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'Changes made' });
    expect(badge).toHaveClass('bg-amber-100');
    expect(screen.queryByRole('button', { name: 'View details' })).not.toBeInTheDocument();

    expect(hover(badge)).toHaveTextContent('Change made: Permitted → Not permitted');
  });

  it('shows a green "View details" badge on an LC cell matching its parent', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Only nights' }],
      ]),
      hasParent: true,
      parentPermissions: new Map([
        [
          KEY,
          {
            permission: Permissions.LIMITS,
            limitId: 'limit-1',
            restrictionDescription: 'Only nights',
          },
        ],
      ]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'View details' });
    expect(badge).toHaveClass('bg-green-100');

    const tooltip = hover(badge);
    expect(tooltip).toHaveTextContent('Limits and conditions');
    expect(tooltip).toHaveTextContent('Selected LC: Certification');
    expect(tooltip).toHaveTextContent('Only nights');
    expect(tooltip).not.toHaveTextContent('Change made');
  });

  it('shows an amber "View details" badge on an LC override, with the change spelled out', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: 'Cert required' }],
      ]),
      hasParent: true,
      parentPermissions: new Map([[KEY, { permission: Permissions.PERFORM }]]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'View details' });
    expect(badge).toHaveClass('bg-amber-100');

    const tooltip = hover(badge);
    expect(tooltip).toHaveTextContent('Change made: Permitted → Limits and conditions');
    expect(tooltip).toHaveTextContent('Selected LC: Certification');
    expect(tooltip).toHaveTextContent('Cert required');
  });

  it('names the parent limit so a limit-only change is legible', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-2' }]]),
      hasParent: true,
      parentPermissions: new Map([
        [KEY, { permission: Permissions.LIMITS, limitId: 'limit-1', limitName: 'Certification' }],
      ]),
    });
    await openBundle();

    const tooltip = hover(screen.getByRole('button', { name: 'View details' }));
    expect(tooltip).toHaveTextContent(
      'Change made: Limits and conditions (Certification) → Limits and conditions',
    );
    expect(tooltip).toHaveTextContent('Selected LC: Supervision');
    expect(tooltip).not.toHaveTextContent('Restriction description changed:');
  });

  it.each([
    { change: 'edited', parent: 'Only nights', own: 'Only days' },
    { change: 'added', parent: null, own: 'Only days' },
    { change: 'removed', parent: 'Only nights', own: null },
  ])('shows both descriptions when an LC restriction is $change', async ({ parent, own }) => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-1', restrictionDescription: own ?? undefined }],
      ]),
      hasParent: true,
      parentPermissions: new Map([
        [
          KEY,
          { permission: Permissions.LIMITS, limitId: 'limit-1', restrictionDescription: parent },
        ],
      ]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'View details' });
    expect(badge).toHaveClass('bg-amber-100');
    const tooltip = hover(badge);
    expect(tooltip).toHaveTextContent('Selected LC: Certification');
    expect(tooltip).toHaveTextContent('Restriction description changed:');
    expect(within(tooltip).getByText(`From: ${parent ?? 'None'}`)).toBeInTheDocument();
    expect(within(tooltip).getByText(`To: ${own ?? 'None'}`)).toBeInTheDocument();
  });

  it('does not describe normalized-equal restriction text as a change', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [KEY, { limitId: 'limit-2', restrictionDescription: '  Only nights  ' }],
      ]),
      hasParent: true,
      parentPermissions: new Map([
        [
          KEY,
          {
            permission: Permissions.LIMITS,
            limitId: 'limit-1',
            restrictionDescription: 'Only nights',
          },
        ],
      ]),
    });
    await openBundle();

    const tooltip = hover(screen.getByRole('button', { name: 'View details' }));
    expect(tooltip).toHaveTextContent('Only nights');
    expect(tooltip).not.toHaveTextContent('Restriction description changed:');
  });

  it('still badges an LC cell on a template with no parent', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
      hasParent: false,
      parentPermissions: new Map(),
    });
    await openBundle();

    expect(screen.getByRole('button', { name: 'View details' })).toHaveClass('bg-green-100');
  });

  it('leaves an unchanged Y cell unbadged', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      hasParent: true,
      parentPermissions: new Map([[KEY, { permission: Permissions.PERFORM }]]),
    });
    await openBundle();

    expect(screen.queryByRole('button', { name: 'Changes made' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View details' })).not.toBeInTheDocument();
  });

  it('reopens the Limits and Conditions dialog from an LC badge', async () => {
    renderFinalize({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
      hasParent: false,
      parentPermissions: new Map(),
    });
    await openBundle();

    fireEvent.click(screen.getByRole('button', { name: 'View details' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Limits and Conditions')).toBeInTheDocument();
  });

  it('keeps LC details accessible without asserting a comparison when the parent is unavailable', async () => {
    renderFinalize({
      hasParent: true,
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1' }]]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'View details' });
    expect(badge).toHaveClass('bg-gray-100');
    const tooltip = hover(badge);
    expect(tooltip).toHaveTextContent('Parent comparison unavailable.');
    expect(tooltip).toHaveTextContent('Selected LC: Certification');
    expect(tooltip).not.toHaveTextContent('Change made:');

    fireEvent.click(badge);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('preserves an inactive LC name through viewing and saving the dialog without changing the payload', async () => {
    renderFinalize({
      hasParent: false,
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([
        [
          KEY,
          {
            limitId: 'inactive-limit',
            limitName: 'Retired certification',
            restrictionDescription: 'Keep this restriction',
          },
        ],
      ]),
    });
    await openBundle();

    const badge = screen.getByRole('button', { name: 'View details' });
    expect(hover(badge)).toHaveTextContent('Selected LC: Retired certification');
    fireEvent.click(badge);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: /Limits and Conditions list/ }),
    ).toHaveTextContent('Retired certification');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(ctx.getPermissionLimit(ACTIVITY, OCCUPATION)?.limitName).toBe('Retired certification');
    expect(ctx.getTemplateChanges().permissionUpserts).toEqual([]);
    expect(ctx.getPermissionsArray()[0]).not.toHaveProperty('limitName');
  });
});
