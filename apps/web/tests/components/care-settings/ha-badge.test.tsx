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

describe('Changes made by HA comparison', () => {
  beforeEach(() => renderWizard());

  it('flags a cell whose permission differs from the parent (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      parentPermissions: new Map([[KEY, Permissions.PERFORM]]),
    });

    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(true);
  });

  it('leaves a cell matching the parent unflagged (UI case 15)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      parentPermissions: new Map([[KEY, Permissions.PERFORM]]),
    });

    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('treats a pair absent from both sides as N so an untouched cell is unflagged (UI case 16)', () => {
    initialise({
      permissions: new Map(),
      parentPermissions: new Map([[`${ACTIVITY}::occupation-9`, Permissions.PERFORM]]),
    });

    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });

  it('flags a cell the parent does not have when this template permits it (UI case 16)', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      parentPermissions: new Map([[`${ACTIVITY}::occupation-9`, Permissions.PERFORM]]),
    });

    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(true);
  });

  it('never flags anything on a template with no parent', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      parentPermissions: new Map(),
    });

    expect(ctx.isChangedFromParent(ACTIVITY, OCCUPATION)).toBe(false);
  });
});
