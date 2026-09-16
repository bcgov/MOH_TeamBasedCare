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
import { normalizeRestrictionDescription, Permissions } from '@tbcm/common';
import { useCareSettingsContext, ParentComparison, PermissionLimit } from './CareSettingsContext';
import { Card } from '../generic/Card';
import { ModalWrapper } from '../Modal';
import { Button } from '../Button';
import { Tooltip } from '../generic/Tooltip';
import { LimitsConditionsModal, PermissionLimitValue } from './limits-conditions-modal';
import { useLimitsConditions } from 'src/services/useLimitConditions';

const PERMISSION_DISPLAY: Record<string, string> = {
  [Permissions.PERFORM]: 'Permitted',
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
  /** Rendered on top of the closed select, after the value and caret. */
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
          badge ? 'pr-[calc(100%-2.5rem)]' : 'pr-8'
        }`}
      >
        <option value={Permissions.PERFORM}>Y</option>
        <option value={Permissions.NO}>N</option>
        <option value={Permissions.LIMITS}>LC</option>
      </select>
      {badge && (
        <div className='pointer-events-none absolute inset-y-0 left-16 right-2 flex min-w-0 items-center'>
          {badge}
        </div>
      )}
      <div
        className={`pointer-events-none absolute inset-y-0 flex items-center justify-center ${
          badge ? 'left-9 w-6 text-bcBlack' : 'right-0 px-2 text-gray-500'
        }`}
      >
        <svg
          aria-hidden='true'
          focusable='false'
          className='h-4 w-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </div>
    </div>
  );
};

/**
 * Marks a permission cell.
 *
 * A Y/N cell that overrides its parent shows an amber "Changes made". Every LC
 * cell shows "View details" — green when it matches the parent (or has no
 * parent), amber when it differs — and doubles as the way back into the Limits
 * and Conditions dialog, which is otherwise unreachable once it has been saved.
 */
const PermissionBadge: React.FC<{
  comparison: ParentComparison;
  ownPermission: Permissions;
  ownLimit?: PermissionLimit;
  /** Resolves a limit id to its catalogue name for the tooltip. */
  getLimitName: (limitId?: string | null) => string | undefined;
  onOpenLimits: () => void;
}> = ({ comparison, ownPermission, ownLimit, getLimitName, onOpenLimits }) => {
  const { kind, parent } = comparison;

  if (kind === 'none') return null;

  const isLc = ownPermission === Permissions.LIMITS;
  const isUnchanged = kind === 'lc-unchanged';
  const isUnavailable = kind === 'lc-unavailable';

  // The badge shares the cell with the select, and cells can be as narrow as
  // 150px, so it is allowed to shrink and clip to an ellipsis rather than push
  // the permission value out of view. The tooltip restores the wording.
  const badgeClasses = `pointer-events-auto block min-w-0 max-w-full truncate rounded-sm border text-xs font-normal leading-4 px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bcBluePrimary ${
    isUnavailable
      ? 'border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200'
      : isUnchanged
        ? 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200'
        : 'border-bcYellowPrimary bg-bcYellowPrimary/50 text-bcBlack hover:bg-bcYellowPrimary/60'
  }`;

  const label = isLc ? 'View details' : 'Changes made';

  // A parent LC is named so a limit-only change reads as an actual change
  // rather than "Limits and conditions → Limits and conditions".
  const describeParent = (): string => {
    if (!parent) return '';
    const display = PERMISSION_DISPLAY[parent.permission] ?? parent.permission;
    if (parent.permission !== Permissions.LIMITS) return display;
    const parentLimitName = parent.limitName ?? getLimitName(parent.limitId);
    return parentLimitName ? `${display} (${parentLimitName})` : display;
  };

  const ownLimitName = getLimitName(ownLimit?.limitId) ?? ownLimit?.limitName;
  const restriction = normalizeRestrictionDescription(ownLimit?.restrictionDescription);
  const parentRestriction = normalizeRestrictionDescription(parent?.restrictionDescription);
  const restrictionChanged =
    kind === 'lc-changed' &&
    parent?.permission === Permissions.LIMITS &&
    parentRestriction !== restriction;

  const content = (
    <span className='block space-y-1'>
      {isUnchanged || isUnavailable ? (
        <span className='block'>{PERMISSION_DISPLAY[Permissions.LIMITS]}</span>
      ) : (
        <span className='block'>
          Change made: {describeParent()} → {PERMISSION_DISPLAY[ownPermission] ?? ownPermission}
        </span>
      )}
      {isUnavailable && <span className='block'>Parent comparison unavailable.</span>}
      {isLc && ownLimitName && <span className='block'>Selected LC: {ownLimitName}</span>}
      {restrictionChanged ? (
        <span className='block'>
          <span className='block font-semibold'>Restriction description changed:</span>
          <span className='block whitespace-pre-wrap'>From: {parentRestriction ?? 'None'}</span>
          <span className='block whitespace-pre-wrap'>To: {restriction ?? 'None'}</span>
        </span>
      ) : (
        isLc && restriction && <span className='block whitespace-pre-wrap'>{restriction}</span>
      )}
    </span>
  );

  return (
    <Tooltip
      triggerClassName={badgeClasses}
      onClick={isLc ? onOpenLimits : undefined}
      content={content}
      scrollableContentLabel='Permission details'
    >
      {label}
    </Tooltip>
  );
};

const ActivityOccupationGrid: React.FC<{
  activityId: string;
  activityName: string;
  hasNoPermissions: boolean;
  getLimitName: (limitId?: string | null) => string | undefined;
  onEditLimits: (target: LimitsEditTarget) => void;
}> = ({ activityId, activityName, hasNoPermissions, getLimitName, onEditLimits }) => {
  const { state, dispatch, getPermission, getPermissionLimit, getParentComparison } =
    useCareSettingsContext();

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
            const comparison = getParentComparison(activityId, occupation.id);

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
                    comparison.kind === 'none' ? undefined : (
                      <PermissionBadge
                        comparison={comparison}
                        ownPermission={permission}
                        ownLimit={getPermissionLimit(activityId, occupation.id)}
                        getLimitName={getLimitName}
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
                    )
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
  getLimitName: (limitId?: string | null) => string | undefined;
  onEditLimits: (target: LimitsEditTarget) => void;
}> = ({ bundleId, bundleName, activitiesWithoutPermissions, getLimitName, onEditLimits }) => {
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
              getLimitName={getLimitName}
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

  // The catalogue is already loaded for the dialog, so badge tooltips resolve
  // limit names from it rather than issuing a request of their own.
  const limitNamesById = useMemo(
    () => new Map(limits.map(limit => [limit.id, limit.name])),
    [limits],
  );

  const getLimitName = (limitId?: string | null) =>
    limitId ? limitNamesById.get(limitId) : undefined;

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
              getLimitName={getLimitName}
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
