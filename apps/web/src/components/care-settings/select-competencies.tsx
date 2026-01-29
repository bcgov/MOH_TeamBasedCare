/**
 * Select Competencies Component (Step 2 of Edit Wizard)
 *
 * Two-panel UI for selecting care competencies (bundles) and activities.
 * Left panel: List of available bundles with checkboxes
 * Right panel: Activities within the selected bundle
 *
 * Features:
 * - Search filtering for both bundles and activities
 * - Select/deselect all activities in current bundle
 * - Activity count display per bundle
 * - Activity type tags (Restricted Activity, etc.)
 */
import { useState } from 'react';
import { useCareSettingsContext } from './CareSettingsContext';
import { SearchBar } from '../generic/SearchBar';
import { Card } from '../generic/Card';
import { Tag } from '../generic/Tag';
import { pickTagStyle } from 'src/common/util';
import { ActivityTagVariants } from 'src/common/constants';

const getName = (item: { name?: string; displayName?: string }): string => {
  return item.name || item.displayName || '';
};

export const SelectCompetencies: React.FC = () => {
  const { state, dispatch } = useCareSettingsContext();
  const [bundleSearch, setBundleSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  const filteredBundles = state.bundles.filter(bundle =>
    getName(bundle).toLowerCase().includes(bundleSearch.toLowerCase()),
  );

  // Calculate total activities across all bundles
  const totalActivityCount = state.bundles.reduce(
    (sum, bundle) => sum + (bundle.careActivities?.length || 0),
    0,
  );

  const selectedBundle = state.bundles.find(b => b.id === state.selectedBundleId);

  const filteredActivities = selectedBundle?.careActivities?.filter(activity =>
    getName(activity).toLowerCase().includes(activitySearch.toLowerCase()),
  ) || [];

  const handleBundleToggle = (bundleId: string) => {
    dispatch({ type: 'TOGGLE_BUNDLE', payload: bundleId });
  };

  const handleBundleSelect = (bundleId: string) => {
    dispatch({ type: 'SET_SELECTED_BUNDLE_ID', payload: bundleId });
  };

  const handleActivityToggle = (activityId: string) => {
    dispatch({ type: 'TOGGLE_ACTIVITY', payload: activityId });
  };

  const handleSelectAllActivities = () => {
    const activityIds = filteredActivities.map(a => a.id);
    const allSelected = activityIds.every(id => state.selectedActivityIds.has(id));

    if (allSelected) {
      dispatch({ type: 'DESELECT_ALL_ACTIVITIES', payload: activityIds });
    } else {
      dispatch({ type: 'SELECT_ALL_ACTIVITIES', payload: activityIds });
    }
  };

  const getSelectedCountForBundle = (bundleId: string) => {
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle?.careActivities) return { selected: 0, total: 0 };
    const selected = bundle.careActivities.filter(a => state.selectedActivityIds.has(a.id)).length;
    return { selected, total: bundle.careActivities.length };
  };

  const allFilteredActivitiesSelected =
    filteredActivities.length > 0 &&
    filteredActivities.every(a => state.selectedActivityIds.has(a.id));

  const selectedFilteredCount = filteredActivities.filter(a =>
    state.selectedActivityIds.has(a.id),
  ).length;

  return (
    <Card bgWhite>
      <div className='flex gap-6 min-h-[500px]'>
        {/* Left Panel - Bundles */}
        <div className='w-1/3 border-r pr-4'>
          <div className='mb-4'>
            <h3 className='text-base font-semibold text-bcBluePrimary mb-2'>Care Competencies</h3>
            <p className='text-[13px] text-gray-500 mb-3'>
              {totalActivityCount} Activities
            </p>
            <SearchBar
              handleChange={e => setBundleSearch(e.target.value)}
              placeholderText='Search'
            />
          </div>

          <div className='overflow-y-auto max-h-[400px]'>
            {filteredBundles.map(bundle => {
              const counts = getSelectedCountForBundle(bundle.id);
              const isSelected = state.selectedBundleId === bundle.id;
              const isChecked = state.selectedBundleIds.has(bundle.id);

              return (
                <div
                  key={bundle.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${
                    isSelected ? 'bg-gray-200' : ''
                  }`}
                  onClick={() => handleBundleSelect(bundle.id)}
                >
                  <input
                    type='checkbox'
                    checked={isChecked}
                    onChange={e => {
                      e.stopPropagation();
                      handleBundleToggle(bundle.id);
                    }}
                    onClick={e => e.stopPropagation()}
                    className='mr-3 h-6 w-6 accent-bcBlueLink'
                  />
                  <div className='flex-1 min-w-0'>
                    <p className='truncate'>{getName(bundle)}</p>
                    <p className='text-[10px] font-bold text-gray-500'>
                      {counts.selected}/{counts.total} selection
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredBundles.length === 0 && (
              <p className='text-center text-sm text-gray-500 mt-4'>
                No care competencies found
              </p>
            )}
          </div>
        </div>

        {/* Right Panel - Activities */}
        <div className='flex-1 pl-4'>
          {selectedBundle ? (
            <>
              <div className='mb-4'>
                <h3 className='text-base font-semibold text-bcBluePrimary mb-2'>Care Activities</h3>
                <SearchBar
                  handleChange={e => setActivitySearch(e.target.value)}
                  placeholderText='Search by keyword'
                />
              </div>

              <div className='flex items-center py-2 px-1 border-b'>
                <input
                  type='checkbox'
                  checked={allFilteredActivitiesSelected}
                  onChange={handleSelectAllActivities}
                  className='mr-3 h-6 w-6 accent-bcBlueLink'
                />
                <label className='font-medium'>
                  Select all{' '}
                  <span className='font-bold'>
                    ({selectedFilteredCount} / {filteredActivities.length} Selected)
                  </span>
                </label>
              </div>

              <div className='overflow-y-auto max-h-[350px] mt-2'>
                {filteredActivities.map(activity => (
                  <div key={activity.id} className='flex items-center p-2 hover:bg-gray-50'>
                    <div className='flex-1 flex items-center'>
                      <input
                        type='checkbox'
                        id={`activity-${activity.id}`}
                        checked={state.selectedActivityIds.has(activity.id)}
                        onChange={() => handleActivityToggle(activity.id)}
                        className='mr-3 h-6 w-6 min-w-6 accent-bcBlueLink'
                      />
                      <label htmlFor={`activity-${activity.id}`} className='cursor-pointer'>
                        {getName(activity)}
                      </label>
                    </div>
                    <div className='flex gap-1'>
                      {activity.activityType && (
                        <Tag
                          text={activity.activityType}
                          tagStyle={pickTagStyle(activity.activityType as unknown as ActivityTagVariants)}
                        />
                      )}
                      {activity.clinicalType && (
                        <Tag
                          text={activity.clinicalType}
                          tagStyle={pickTagStyle(activity.clinicalType as unknown as ActivityTagVariants)}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {filteredActivities.length === 0 && (
                  <p className='text-center text-sm text-gray-500 mt-4'>
                    No activities found
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className='flex items-center justify-center h-full'>
              <p className='text-gray-500'>Select a care competency to view activities</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
