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

const getName = (item: { name?: string; displayName?: string }): string => {
  return item.displayName || item.name || '';
};

const PermissionSelect: React.FC<{
  value: Permissions;
  onChange: (value: Permissions) => void;
}> = ({ value, onChange }) => {
  return (
    <div className='relative'>
      <select
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
        className='appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm w-full bg-white cursor-pointer'
      >
        <option value={Permissions.PERFORM}>Y</option>
        <option value={Permissions.NO}>N</option>
        <option value={Permissions.LIMITS}>LC</option>
      </select>
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </div>
    </div>
  );
};

const ActivityOccupationGrid: React.FC<{
  activityId: string;
  activityName: string;
  hasNoPermissions: boolean;
}> = ({ activityId, activityName, hasNoPermissions }) => {
  const { state, dispatch, getPermission } = useCareSettingsContext();

  const handlePermissionChange = (occupationId: string, permission: Permissions) => {
    dispatch({
      type: 'SET_PERMISSION',
      payload: { activityId, occupationId, permission },
    });
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
        {hasNoPermissions && (
          <span className='text-xs font-normal text-amber-600'>(no permissions set)</span>
        )}
      </h4>
      <div className='overflow-x-auto'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 min-w-[400px]'>
          {state.occupations.map(occupation => (
            <div key={occupation.id} className='flex flex-col min-w-[150px]'>
              <label
                className='text-[15px] text-gray-600 mb-1 truncate'
                title={getName(occupation)}
              >
                {getName(occupation)}
              </label>
              <PermissionSelect
                value={getPermission(activityId, occupation.id) || Permissions.NO}
                onChange={value => handlePermissionChange(occupation.id, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BundleAccordion: React.FC<{
  bundleId: string;
  bundleName: string;
  activitiesWithoutPermissions: Set<string>;
}> = ({ bundleId, bundleName, activitiesWithoutPermissions }) => {
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
            {activitiesNeedingPermissions.length > 0 && (
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
  const { state, getPermission } = useCareSettingsContext();

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

  return (
    <Card bgWhite>
      <div className='flex justify-end mb-4'>
        <Button variant='outline' onClick={() => setShowLegend(true)}>
          Table Legend
        </Button>
      </div>

      {missingCount > 0 && (
        <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='h-5 w-5 text-amber-500' />
          <div>
            <span className='font-semibold text-amber-800'>
              {missingCount} {missingCount === 1 ? 'activity has' : 'activities have'} no occupation
              permissions
            </span>
            <p className='text-sm text-amber-700'>
              Please review the highlighted activities below and set permissions where needed.
            </p>
          </div>
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
            />
          ))
        )}
      </div>

      <LegendModal isOpen={showLegend} setIsOpen={setShowLegend} />
    </Card>
  );
};
