/**
 * Limits state and the "Changes made by HA" badge — UI cases 14, 14a, 14b, 15, 16.
 *
 * The reducer is exercised through the provider rather than in isolation,
 * because the rules being protected here are about how the wizard's permission
 * map and its limits map stay in step: a limit that outlives its LC permission
 * would be silently re-attached, and a badge that ignores the "absent means N"
 * convention would appear on every untouched cell in the grid.
 */
import { act, render, screen } from '@testing-library/react';
import { Permissions } from '@tbcm/common';
import {
  CareSettingsProvider,
  CareSettingsState,
  useCareSettingsContext,
} from 'src/components/care-settings/CareSettingsContext';

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

const initialise = (payload: Partial<CareSettingsState>) =>
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

/**
 * These cover only the comparison itself. *Which* template supplies the
 * baseline \u2014 provincial at any depth, rather than the parent \u2014 is decided
 * server-side and is covered by the master-ancestor walk in the API spec and
 * by the "a site is measured against provincial" browser test; it is not
 * observable from here, since the reducer sees only the baseline it is handed.
 */
describe('Changes made by HA comparison', () => {
  beforeEach(() => renderWizard());

  it('flags a cell whose permission differs from the provincial master (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      masterPermissions: new Map([[KEY, Permissions.PERFORM]]),
      masterBaselineStatus: 'ready',
    });

    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(true);
  });

  it('leaves a cell matching the provincial master unflagged (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      masterPermissions: new Map([[KEY, Permissions.PERFORM]]),
      masterBaselineStatus: 'ready',
    });

    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('treats a pair absent from both sides as N so an untouched cell is unflagged (UI case 16)', () => {
    initialise({
      permissions: new Map(),
      masterPermissions: new Map([[`${ACTIVITY}::occupation-9`, Permissions.PERFORM]]),
      masterBaselineStatus: 'ready',
    });

    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('flags a cell the provincial master does not have when this template permits it (UI case 16)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      masterPermissions: new Map([[`${ACTIVITY}::occupation-9`, Permissions.PERFORM]]),
      masterBaselineStatus: 'ready',
    });

    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(true);
  });

  it.each([Permissions.PERFORM, Permissions.LIMITS])(
    'flags %s against a successfully loaded empty master',
    permission => {
      initialise({
        permissions: new Map([[KEY, permission]]),
        masterPermissions: new Map(),
        masterBaselineStatus: 'ready',
      });

      expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(true);
    },
  );

  it('does not flag explicit or implicit N against an empty master', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.NO]]),
      masterBaselineStatus: 'ready',
    });
    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(false);
    expect(ctx.isChangedFromMaster(ACTIVITY, 'occupation-2')).toBe(false);
  });

  it.each(['loading', 'missing', 'failed'] as const)(
    'never flags a cell when the baseline is %s, even with stale rows',
    masterBaselineStatus => {
      initialise({
        permissions: new Map([[KEY, Permissions.PERFORM]]),
        masterPermissions: new Map([[KEY, Permissions.LIMITS]]),
        masterBaselineStatus,
      });
      expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(false);
    },
  );

  it('starts comparing an empty master only after it has loaded', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
    });
    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(false);

    act(() => {
      ctx.dispatch({
        type: 'SET_MASTER_BASELINE',
        payload: { status: 'ready', permissions: new Map() },
      });
    });
    expect(ctx.isChangedFromMaster(ACTIVITY, OCCUPATION)).toBe(true);
  });
});
