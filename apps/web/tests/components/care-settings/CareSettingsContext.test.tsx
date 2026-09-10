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
  return <span data-testid='context-probe' />;
};

const renderContext = () => {
  render(
    <CareSettingsProvider>
      <Probe />
    </CareSettingsProvider>,
  );
  screen.getByTestId('context-probe');
};

const initialise = (payload: any) =>
  act(() => {
    ctx.dispatch({ type: 'INITIALIZE_STATE', payload });
  });

describe('template save deltas', () => {
  beforeEach(renderContext);

  it('emits only an LC detail change from the loaded permission snapshot', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.LIMITS]]),
      permissionLimits: new Map([[KEY, { limitId: 'limit-1', restrictionDescription: 'Nights' }]]),
      selectedBundleIds: new Set(['bundle-1']),
      selectedActivityIds: new Set([ACTIVITY]),
    });

    act(() => {
      ctx.dispatch({
        type: 'SET_PERMISSION_LIMIT',
        payload: {
          activityId: ACTIVITY,
          occupationId: OCCUPATION,
          limit: { limitId: 'limit-1', restrictionDescription: 'Days' },
        },
      });
    });

    expect(ctx.getTemplateChanges()).toEqual({
      permissionUpserts: [
        {
          activityId: ACTIVITY,
          occupationId: OCCUPATION,
          permission: Permissions.LIMITS,
          limitId: 'limit-1',
          restrictionDescription: 'Days',
        },
      ],
      permissionRemovals: [],
      selectedBundleIdsToAdd: [],
      selectedBundleIdsToRemove: [],
      selectedActivityIdsToAdd: [],
      selectedActivityIdsToRemove: [],
    });
  });

  it('emits a removal and selected-content deltas without unrelated entries', () => {
    initialise({
      permissions: new Map([[KEY, Permissions.PERFORM]]),
      permissionLimits: new Map(),
      selectedBundleIds: new Set(['bundle-1']),
      selectedActivityIds: new Set([ACTIVITY, 'activity-2']),
    });

    act(() => {
      ctx.dispatch({
        type: 'SET_PERMISSION',
        payload: { activityId: ACTIVITY, occupationId: OCCUPATION, permission: Permissions.NO },
      });
      ctx.dispatch({ type: 'TOGGLE_BUNDLE', payload: 'bundle-2' });
      ctx.dispatch({ type: 'TOGGLE_ACTIVITY', payload: 'activity-2' });
    });

    expect(ctx.getTemplateChanges()).toEqual({
      permissionUpserts: [],
      permissionRemovals: [{ activityId: ACTIVITY, occupationId: OCCUPATION }],
      selectedBundleIdsToAdd: ['bundle-2'],
      selectedBundleIdsToRemove: [],
      selectedActivityIdsToAdd: [],
      selectedActivityIdsToRemove: ['activity-2'],
    });
  });
});
