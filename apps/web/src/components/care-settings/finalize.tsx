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
import { useState, SetStateAction } from 'react';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Permissions } from '@tbcm/common';
import { useCareSettingsContext } from './CareSettingsContext';
import { Card } from '../generic/Card';
import { ModalWrapper } from '../Modal';
import { Button } from '../Button';

const getName = (item: { name?: string; displayName?: string }): string => {
  return item.name || item.displayName || '';
};

const PermissionSelect: React.FC<{
  value: Permissions;
  onChange: (value: Permissions) => void;
}> = ({ value, onChange }) => {
  return (
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
      className='border border-gray-300 rounded px-2 py-1 text-sm w-full bg-white h-10'
    >
      <option value={Permissions.PERFORM}>Y</option>
      <option value={Permissions.NO}>N</option>
      <option value={Permissions.LIMITS}>LC</option>
    </select>
  );
};

const ActivityOccupationGrid: React.FC<{
  activityId: string;
  activityName: string;
}> = ({ activityId, activityName }) => {
  const { state, dispatch, getPermission } = useCareSettingsContext();

  const handlePermissionChange = (occupationId: string, permission: Permissions) => {
    dispatch({
      type: 'SET_PERMISSION',
      payload: { activityId, occupationId, permission },
    });
  };

  return (
    <div className='border-t py-4'>
      <h4 className='font-bold text-gray-800 mb-4'>{activityName}</h4>
      <div className='overflow-x-auto'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 min-w-[400px]'>
          {state.occupations.map(occupation => (
            <div key={occupation.id} className='flex flex-col min-w-[150px]'>
              <label className='text-[15px] text-gray-600 mb-1 truncate' title={getName(occupation)}>
                {getName(occupation)}
              </label>
              <PermissionSelect
                value={getPermission(activityId, occupation.id) || Permissions.PERFORM}
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
}> = ({ bundleId, bundleName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useCareSettingsContext();

  const bundle = state.bundles.find(b => b.id === bundleId);
  const selectedActivities =
    bundle?.careActivities?.filter(a => state.selectedActivityIds.has(a.id)) || [];

  // Count restricted activities
  const restrictedCount = selectedActivities.filter(
    a => a.activityType === 'Restricted Activity',
  ).length;
  const careCount = selectedActivities.length - restrictedCount;

  if (selectedActivities.length === 0) {
    return null;
  }

  return (
    <div className='border-b'>
      <button
        type='button'
        className='w-full flex items-center justify-between py-4 hover:bg-gray-50'
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex items-center gap-2'>
          <span className='font-semibold text-bcBluePrimary'>{bundleName}</span>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-bcBlueLink'>
            {careCount} care & {restrictedCount > 0 ? `${restrictedCount} restricted` : '0 restricted'} activities
          </span>
          <FontAwesomeIcon
            icon={isOpen ? faChevronDown : faChevronRight}
            className='text-gray-500'
          />
        </div>
      </button>

      {isOpen && (
        <div className='pb-4'>
          {selectedActivities.map(activity => (
            <ActivityOccupationGrid
              key={activity.id}
              activityId={activity.id}
              activityName={getName(activity)}
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
  const { state } = useCareSettingsContext();

  const selectedBundles = state.bundles.filter(b => state.selectedBundleIds.has(b.id));

  return (
    <Card bgWhite>
      <div className='flex justify-end mb-4'>
        <Button variant='outline' onClick={() => setShowLegend(true)}>
          Table Legend
        </Button>
      </div>

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
            />
          ))
        )}
      </div>

      <LegendModal isOpen={showLegend} setIsOpen={setShowLegend} />
    </Card>
  );
};
