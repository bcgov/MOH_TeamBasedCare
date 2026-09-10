/**
 * Finalize Component (Step 3 of Edit Wizard)
 *
 * Displays selected care competencies with their activities in an accordion view.
 * Allows setting occupation permissions (Y/N/LC) for each activity.
 *
 * Features:
 * - Collapsible accordion for each bundle
 * - Responsive permission grid with horizontal scroll
 * - Activity counts (care vs restricted)
 * - Table legend modal explaining permission values
 *
 * Permission values:
 * - Y (Yes): Occupation can perform the activity
 * - N (No): Removes permission entry
 * - LC (Limits & Conditions): Activity can be performed with restrictions
 */
import { useState, SetStateAction, useMemo } from 'react';
import {
  faChevronDown,
  faChevronRight,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Permissions } from '@tbcm/common';
import { useCareSettingsContext } from './CareSettingsContext';
import { Card } from '../generic/Card';
import { ModalWrapper } from '../Modal';
import { Button } from '../Button';
import { Tooltip } from '../generic/Tooltip';
import { LimitsConditionsModal, PermissionLimitValue } from './limits-conditions-modal';
import { useLimitsConditions } from 'src/services/useLimitConditions';

const PERMISSION_DISPLAY: Record<string, string> = {
  [Permissions.PERFORM]: 'Perform',
  [Permissions.NO]: 'Not permitted',
  [Permissions.LIMITS]: 'Limits and conditions',
};

/** Cell currently being edited in the Limits and Conditions dialog. */
interface LimitsEditTarget {
  activityId: string;
  occupationId: string;
  activityName: string;
  occupationName: string;
  /** Permission the cell held before LC, so Cancel can put it back. */
  previousPermission: Permissions;
  /** True when reopening an existing LC cell, where Cancel must not revert. */
  isExisting: boolean;
}

const getName = (item: { name?: string; displayName?: string }): string => {
  return item.displayName || item.name || '';
};

const PermissionSelect: React.FC<{
  id: string;
  value: Permissions;
  onChange: (value: Permissions) => void;
  /** Rendered on top of the closed select, left of the caret. */
  badge?: React.ReactNode;
}> = ({ id, value, onChange, badge }) => {
  return (
    <div className='relative'>
      <select
        id={id}
        value={value}
        onChange={e => {
          const val = e.target.value;
          if (val === Permissions.PERFORM) {
            onChange(Permissions.PERFORM);
          } else if (val === Permissions.NO) {
            onChange(Permissions.NO);
          } else if (val === Permissions.LIMITS) {
            onChange(Permissions.LIMITS);
          }
        }}
        className={`appearance-none border border-gray-300 rounded px-3 py-2 text-sm w-full bg-white cursor-pointer ${
          badge ? 'pr-16' : 'pr-8'
        }`}
      >
        <option value={Permissions.PERFORM}>Y</option>
        <option value={Permissions.NO}>N</option>
        <option value={Permissions.LIMITS}>LC</option>
      </select>
      {badge && (
        <div className='absolute inset-y-0 right-7 flex min-w-0 max-w-[calc(100%-4.5rem)] items-center'>
          {badge}
        </div>
      )}
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </div>
    </div>
  );
};

/**
 * Marks a cell whose permission differs from the parent template's. Doubles as
 * the way back into the Limits and Conditions dialog for an LC cell, which is
 * otherwise unreachable once the dialog has been saved.
 */
const ChangedByHaBadge: React.FC<{
  isLc: boolean;
  parentPermission: Permissions;
  ownPermission: Permissions;
  onOpenLimits: () => void;
}> = ({ isLc, parentPermission, ownPermission, onOpenLimits }) => {
  // The badge shares the cell with the select, and cells can be as narrow as
  // 150px, so it carries the full wording but is allowed to shrink and clip it
  // to an ellipsis rather than push the permission value out of view. The
  // tooltip restores the wording when it is clipped.
  const badgeClasses =
    'block min-w-0 max-w-full truncate rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold leading-none px-1.5 py-1 hover:bg-amber-200';

  const label = 'Changes made by HA';

  return (
    <Tooltip
      triggerClassName={badgeClasses}
      onClick={isLc ? onOpenLimits : undefined}
      content={
        <span className='block whitespace-nowrap'>
          Changes made by HA — Parent: {PERMISSION_DISPLAY[parentPermission] ?? parentPermission}{' '}
          → This template: {PERMISSION_DISPLAY[ownPermission] ?? ownPermission}
        </span>
      }
    >
      {label}
    </Tooltip>
  );
};

const ActivityOccupationGrid: React.FC<{
  activityId: string;
  activityName: string;
  hasNoPermissions: boolean;
  onEditLimits: (target: LimitsEditTarget) => void;
}> = ({ activityId, activityName, hasNoPermissions, onEditLimits }) => {
  const { state, dispatch, getPermission, isChangedFromParent } = useCareSettingsContext();

  const handlePermissionChange = (
    occupationId: string,
    occupationName: string,
    permission: Permissions,
  ) => {
    const previousPermission = getPermission(activityId, occupationId) || Permissions.NO;

    dispatch({
      type: 'SET_PERMISSION',
      payload: { activityId, occupationId, permission },
    });

    // Choosing LC is incomplete until a limit is picked, so the dialog opens
    // straight away rather than leaving the cell in a half-set state.
    if (permission === Permissions.LIMITS && previousPermission !== Permissions.LIMITS) {
      onEditLimits({
        activityId,
        occupationId,
        activityName,
        occupationName,
        previousPermission,
        isExisting: false,
      });
    }
  };

  return (
    <div
      className={`border-t py-4 ${hasNoPermissions ? 'bg-amber-50 border-l-4 border-l-amber-400 pl-3 -ml-4' : ''}`}
    >
      <h4 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
        {hasNoPermissions && (
          <FontAwesomeIcon icon={faExclamationTriangle} className='h-4 w-4 text-amber-500' />
        )}
        {activityName}
        {process.env.NEXT_PUBLIC_ENABLE_MISSING_COUNT && hasNoPermissions && (
          <span className='text-xs font-normal text-amber-600'>(no permissions set)</span>
        )}
      </h4>
      <div className='overflow-x-auto'>
        {/* Auto-fill rather than fixed breakpoints: the column count follows the
            actual grid width, so a cell never has to overflow its track when the
            viewport lands between two breakpoints. */}
        <div className='grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 min-w-[320px]'>
          {state.occupations.map(occupation => {
            const permission = getPermission(activityId, occupation.id) || Permissions.NO;
            const parentPermission =
              state.parentPermissions.get(`${activityId}::${occupation.id}`) ?? Permissions.NO;

            return (
              <div key={occupation.id} className='flex min-w-0 flex-col'>
                <label
                  htmlFor={`permission-${activityId}-${occupation.id}`}
                  className='text-[15px] text-gray-600 mb-1 truncate'
                  title={getName(occupation)}
                >
                  {getName(occupation)}
                </label>
                <PermissionSelect
                  id={`permission-${activityId}-${occupation.id}`}
                  value={permission}
                  onChange={value =>
                    handlePermissionChange(occupation.id, getName(occupation), value)
                  }
                  badge={
                    isChangedFromParent(activityId, occupation.id) ? (
                      <ChangedByHaBadge
                        isLc={permission === Permissions.LIMITS}
                        parentPermission={parentPermission}
                        ownPermission={permission}
                        onOpenLimits={() =>
                          onEditLimits({
                            activityId,
                            occupationId: occupation.id,
                            activityName,
                            occupationName: getName(occupation),
                            previousPermission: permission,
                            isExisting: true,
                          })
                        }
                      />
                    ) : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BundleAccordion: React.FC<{
  bundleId: string;
  bundleName: string;
  activitiesWithoutPermissions: Set<string>;
  onEditLimits: (target: LimitsEditTarget) => void;
}> = ({ bundleId, bundleName, activitiesWithoutPermissions, onEditLimits }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useCareSettingsContext();

  const bundle = state.bundles.find(b => b.id === bundleId);
  const selectedActivities =
    bundle?.careActivities?.filter(a => state.selectedActivityIds.has(a.id)) || [];

  const activitiesNeedingPermissions = selectedActivities.filter(a =>
    activitiesWithoutPermissions.has(a.id),
  );

  if (selectedActivities.length === 0) {
    return null;
  }

  return (
    <div className='border-b border-l-4 border-l-[#FCBA19]'>
      <button
        type='button'
        className='w-full flex items-center justify-between py-4 px-4 hover:bg-gray-50'
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex flex-col items-start'>
          <span className='font-bold text-bcBluePrimary'>{bundleName}</span>
          <span className='text-sm text-bcBlueLink'>
            {selectedActivities.length} care & restricted activities
            {process.env.NEXT_PUBLIC_ENABLE_MISSING_COUNT &&
              activitiesNeedingPermissions.length > 0 && (
                <span className='text-amber-600 ml-1'>
                  ({activitiesNeedingPermissions.length} without permissions)
                </span>
              )}
          </span>
        </div>
        <FontAwesomeIcon
          icon={isOpen ? faChevronDown : faChevronRight}
          className='h-4 w-4 text-gray-500'
        />
      </button>

      {isOpen && (
        <div className='pb-4 px-4'>
          {selectedActivities.map(activity => (
            <ActivityOccupationGrid
              key={activity.id}
              activityId={activity.id}
              activityName={getName(activity)}
              hasNoPermissions={activitiesWithoutPermissions.has(activity.id)}
              onEditLimits={onEditLimits}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LegendModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
}> = ({ isOpen, setIsOpen }) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title='Table Legend'
      description={
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <span className='font-bold w-12'>Y</span>
            <span>Yes - Occupation can perform this activity</span>
          </div>
          <div className='flex items-center gap-3'>
            <span className='font-bold w-12'>N</span>
            <span>No - Occupation cannot perform this activity</span>
          </div>
          <div className='flex items-center gap-3'>
            <span className='font-bold w-12'>LC</span>
            <span>Limits & Conditions - Activity can be performed with restrictions</span>
          </div>
        </div>
      }
      closeButton={{ title: 'Close' }}
    />
  );
};

export const Finalize: React.FC = () => {
  const [showLegend, setShowLegend] = useState(false);
  const [limitsTarget, setLimitsTarget] = useState<LimitsEditTarget | undefined>();
  const { state, dispatch, getPermission, getPermissionLimit } = useCareSettingsContext();
  const { limits } = useLimitsConditions();

  const selectedBundles = state.bundles.filter(b => state.selectedBundleIds.has(b.id));

  // Calculate which activities have no Y/LC permissions
  const activitiesWithoutPermissions = useMemo(() => {
    const result = new Set<string>();
    state.selectedActivityIds.forEach(activityId => {
      const hasAnyPermission = state.occupations.some(occ => {
        const perm = getPermission(activityId, occ.id);
        return perm === Permissions.PERFORM || perm === Permissions.LIMITS;
      });
      if (!hasAnyPermission) {
        result.add(activityId);
      }
    });
    return result;
  }, [state.selectedActivityIds, state.occupations, state.permissions, getPermission]);

  const missingCount = activitiesWithoutPermissions.size;

  const handleLimitsConfirm = (value: PermissionLimitValue) => {
    if (!limitsTarget) return;
    dispatch({
      type: 'SET_PERMISSION_LIMIT',
      payload: {
        activityId: limitsTarget.activityId,
        occupationId: limitsTarget.occupationId,
        limit: value,
      },
    });
    setLimitsTarget(undefined);
  };

  const handleLimitsCancel = () => {
    if (!limitsTarget) return;

    // Only a cell that has just been switched to LC gets reverted. Reopening an
    // existing LC cell has no prior permission to return to, so cancelling
    // there simply discards the in-dialog edits.
    if (!limitsTarget.isExisting) {
      dispatch({
        type: 'SET_PERMISSION',
        payload: {
          activityId: limitsTarget.activityId,
          occupationId: limitsTarget.occupationId,
          permission: limitsTarget.previousPermission,
        },
      });
    }

    setLimitsTarget(undefined);
  };

  return (
    <Card bgWhite>
      <div className='flex justify-end mb-4'>
        <Button variant='outline' onClick={() => setShowLegend(true)}>
          Table Legend
        </Button>
      </div>

      {process.env.NEXT_PUBLIC_ENABLE_MISSING_COUNT && missingCount > 0 && (
        <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='h-5 w-5 text-amber-500' />
          {process.env.NEXT_PUBLIC_ENABLE_MISSING_COUNT && (
            <div>
              <span className='font-semibold text-amber-800'>
                {missingCount} {missingCount === 1 ? 'activity has' : 'activities have'} no
                occupation permissions
              </span>
              <p className='text-sm text-amber-700'>
                Please review the highlighted activities below and set permissions where needed.
              </p>
            </div>
          )}
        </div>
      )}

      <h3 className='text-bcBlueLink font-semibold mb-4'>
        Care Competencies and Corresponding Activities
      </h3>

      <div className='max-h-[500px] overflow-y-auto'>
        {selectedBundles.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No care competencies selected. Go back to select care competencies first.
          </div>
        ) : (
          selectedBundles.map(bundle => (
            <BundleAccordion
              key={bundle.id}
              bundleId={bundle.id}
              bundleName={getName(bundle)}
              activitiesWithoutPermissions={activitiesWithoutPermissions}
              onEditLimits={setLimitsTarget}
            />
          ))
        )}
      </div>

      <LegendModal isOpen={showLegend} setIsOpen={setShowLegend} />

      {limitsTarget && (
        <LimitsConditionsModal
          isOpen={Boolean(limitsTarget)}
          setIsOpen={() => setLimitsTarget(undefined)}
          limits={limits}
          activityName={limitsTarget.activityName}
          occupationName={limitsTarget.occupationName}
          initialValue={getPermissionLimit(limitsTarget.activityId, limitsTarget.occupationId)}
          onConfirm={handleLimitsConfirm}
          onCancel={handleLimitsCancel}
        />
      )}
    </Card>
  );
};
