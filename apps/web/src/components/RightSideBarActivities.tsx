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
      setFieldValue(
        'careActivities',
        items?.careActivities?.map((e: any) => e.id),
      );
    } else {
      setFieldValue('careActivities', []);
    }
  };

  return (
    <div className='flex-2 flex flex-col min-h-0 w-2/3 ml-4 mt-4 border-2 border-gray-200 p-4'>
      {_.isEmpty(values.careActivityID) ? (
        <p className='text-center text-sm mt-4'>
          Please select an activity bundle on the left side.
        </p>
      ) : (
        <>
          <div className='flex items-center pb-4'>
            <input
              type='checkbox'
              name='selectAll'
              id='selectAll'
              className='mr-3 h-5 w-5 min-w-5 accent-bcBlueLink'
              onChange={handleSelectAll}
              checked={
                values.careActivityBundle[values.careActivityID]?.length ===
                items?.careActivities?.length
              }
            />
            <label className='font-bold' htmlFor={'selectAll'}>
              Select all
            </label>
          </div>

          <SearchBar handleChange={handleSearch} />

          <p className='text-sm text-gray-400'>
            {items && items.careActivities.length} Care Activities Tasks and Restricted Tasks
          </p>

          <div
            className='mt-4'
            role='group'
            aria-labelledby='checkbox-group'
            style={{ overflow: 'auto', maxHeight: '500px' }}
          >
            {!_.isEmpty(filteredData) ? (
              filteredData &&
              filteredData.map((item: any) => {
                return (
                  <div key={item.id} className='flex flex-1 items-center p-1.5'>
                    <div className='flex-initial w-5/6'>
                      <Checkbox
                        name='careActivities'
                        styles='accent-bcBlueLink'
                        value={item.id}
                        label={item.name}
                      />
                    </div>
                    <div className='flex flex-initial w-3/6 justify-end'>
                      <Tag
                        text={item.activityType}
                        tagStyle={pickTagStyle(item.activityType)}
                      ></Tag>
                      {item.clinicalType && (
                        <Tag
                          text={item.clinicalType}
                          tagStyle={pickTagStyle(item.clinicalType)}
                        ></Tag>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='text-center text-sm mt-4'>No available Care Activity Tasks.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
