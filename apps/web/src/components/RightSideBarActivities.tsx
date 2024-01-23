/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { useEffect, useState } from 'react';
import { Checkbox } from '@components';
import _ from 'lodash';
import { useFormikContext } from 'formik';
import { useCareActivities } from '../services';
import { Tag } from './generic/Tag';
import { SearchBar } from './generic/SearchBar';
import { pickTagStyle } from 'src/common/util';
import { AppErrorMessage } from './AppErrorMessage';
import { ActivityTagDefinitions, ActivityTagVariants } from 'src/common';
import { Popover, PopoverPosition } from './generic/Popover';

export const RightSideBarActivites: React.FC = () => {
  const [searchValue, setSearchValue]: [string, (search: string) => void] = useState('');
  const { values, setFieldValue } = useFormikContext<any>();
  const [items, setItems] = useState<any>();
  const { careActivities } = useCareActivities();

  //useEFFECTS
  useEffect(() => {
    if (!_.isUndefined(careActivities)) {
      const newCareActivity = _.find(careActivities.result, function (o) {
        return o.id == values.careActivityID;
      });
      setItems(newCareActivity);
      //Set checked ids to previously selected ids when care activity changes
      values.careActivities = _.filter(values.careActivityBundle[values.careActivityID]);
    }
  }, [values.careActivityID, careActivities]);

  useEffect(() => {
    if (values.careActivityID) {
      values.careActivityBundle[values.careActivityID] = values.careActivities;
    }
  }, [values.careActivities]);

  // Get search value
  const handleSearch = (e: { target: { value: string } }) => {
    setSearchValue(e.target.value);
  };
  // Filter data with search value
  const filteredData =
    items &&
    items.careActivities.filter((item: any) => {
      return item.name.toLowerCase().includes(searchValue.toLowerCase());
    });

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      const careActivitiesSelectedInBundleSet = new Set<string>(values.careActivities);
      (filteredData || []).forEach((activity: any) => {
        careActivitiesSelectedInBundleSet.add(activity.id);
      });
      setFieldValue('careActivities', Array.from(careActivitiesSelectedInBundleSet));
    } else {
      const careActivitiesSelectedInBundleSet = new Set<string>(values.careActivities);
      (filteredData || []).forEach((activity: any) => {
        careActivitiesSelectedInBundleSet.delete(activity.id);
      });
      setFieldValue('careActivities', Array.from(careActivitiesSelectedInBundleSet));
    }
  };

  const SelectAllCheckbox = (
    <div className='flex items-center pt-4 pb-2 px-1.5'>
      <input
        type='checkbox'
        name='selectAll'
        id='selectAll'
        className='mr-3 h-5 w-5 min-w-5 accent-bcBlueLink'
        onChange={handleSelectAll}
        checked={
          filteredData?.length > 0 &&
          filteredData.every((a: any) => values.careActivities.includes(a.id))
        }
      />
      <label htmlFor={'selectAll'}>
        Select all
        <span className='pl-1 font-bold'>
          (
          {
            (filteredData?.filter((d: any) => (values?.careActivities || []).includes(d.id)) || [])
              .length
          }{' '}
          / {(filteredData || []).length} Selected)
        </span>
      </label>
    </div>
  );

  const FilteredList = filteredData?.map((item: any) => {
    return (
      <div key={item.id} className={`flex flex-1 items-center p-1.5`}>
        <div className='flex-initial w-5/6'>
          <Checkbox
            name='careActivities'
            styles='accent-bcBlueLink'
            value={item.id}
            label={item.name}
          />
        </div>
        <div className='flex flex-initial w-3/6 justify-end'>
          <Popover
            position={PopoverPosition.BOTTOM_LEFT}
            title={
              <>
                <Tag text={item.activityType} tagStyle={pickTagStyle(item.activityType)}></Tag>
                {item.clinicalType && (
                  <Tag text={item.clinicalType} tagStyle={pickTagStyle(item.clinicalType)}></Tag>
                )}
              </>
            }
          >
            {() => (
              <>
                {ActivityTagDefinitions?.[item.activityType as ActivityTagVariants]?.text && (
                  <>
                    <div className={`absolute w-4 h-4 rotate-60 bg-bcBlueAccent right-0`}></div>
                    <div className='w-[100px] md:w-[200px] lg:w-[300px] w-auto p-3 text-sm text-white bg-bcBlueAccent shadow-xl rounded-lg'>
                      {ActivityTagDefinitions?.[item.activityType as ActivityTagVariants]?.text}
                    </div>
                  </>
                )}
              </>
            )}
          </Popover>
        </div>
      </div>
    );
  });

  return (
    <div className='flex-2 flex flex-col min-h-0 w-2/3 ml-4 mt-4 border-2 border-gray-200 p-4'>
      {_.isEmpty(values.careActivityID) ? (
        <p className='text-center text-sm mt-4'>
          Please select an activity bundle on the left side.
        </p>
      ) : (
        <>
          <SearchBar handleChange={handleSearch} />

          <p className='text-sm text-gray-400'>
            {values.careActivityBundle[values.careActivityID]?.length} care activities selected
          </p>

          <div className='overflow-auto'>
            <div role='group' aria-labelledby='checkbox-group'>
              {!_.isEmpty(filteredData) ? (
                <>
                  {SelectAllCheckbox}
                  {FilteredList}
                </>
              ) : (
                <AppErrorMessage message={`No available care activity tasks.`} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
