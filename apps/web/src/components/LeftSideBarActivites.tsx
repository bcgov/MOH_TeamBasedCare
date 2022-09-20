/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import _ from 'lodash';
import { useCareActivities } from '../services';
import { Field, useFormikContext } from 'formik';

export interface LeftSideBarActivitesProps {
  title: string;
}

export interface SearchInputProps {
  title: string;
}

export const LeftSideBarActivites: React.FC<LeftSideBarActivitesProps> = ({ title }) => {
  const { careActivities, isLoading } = useCareActivities();
  const [items, setItems] = useState<any>();
  const [selectedItem, setSelectedItem] = useState<any>();
  const [searchValue, setSearchValue]: [string, (search: string) => void] = useState('');
  const { values } = useFormikContext<any>();

  useEffect(() => {
    if (isLoading) {
      setItems(careActivities);
      if (!_.isUndefined(careActivities)) {
        _.each(careActivities.result, item => {
          values.careActivityBundle[item.id] = [];
        });
        values.careActivityID = _.head(careActivities.result).id;
      }
    }
  }, [careActivities]);

  // Get search value
  const handleSearch = (e: { target: { value: string } }) => {
    setSearchValue(e.target.value);
  };
  // Filter data with search value
  const filteredData =
    items &&
    items.result &&
    items.result.filter((item: any) => {
      return item.name.toLowerCase().includes(searchValue.toLowerCase());
    });

  return (
    <div className='w-1/3 mt-4 border-2 border-gray-200 p-4'>
      <div className='justify-between w-full items-center mb-4 border-b-2 border-gray-200 pb-4'>
        <h3 className='text-xl leading-none '>{title}</h3>
        <p className='text-sm text-gray-400'>{items && items.count} Activities</p>
      </div>

      <input
        type='text'
        name='search'
        placeholder='Search '
        className='block w-full text-sm text-slate-500 border-2 border-gray-200 p-2'
        value={searchValue}
        onChange={handleSearch}
      />

      <div className='mt-4' style={{ overflow: 'auto', maxHeight: '400px' }}>
        <div role='group'>
          {!_.isEmpty(filteredData) ? (
            filteredData.map((item: any) => {
              return (
                <label
                  key={item.id}
                  className={`${
                    (values.careActivityID || selectedItem) == item.id && 'bg-gray-200'
                  } careActivityIDlabel flex items-center space-x-4 cursor-pointer p-2 hover:bg-gray-200`}
                  onClick={() => setSelectedItem(String(item.id))}
                >
                  <Field type='radio' name='careActivityID' value={item.id} />
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-bcBluePrimary truncate dark:text-white'>
                      {item.name}
                    </p>
                    <p className='text-sm text-gray-400 truncate dark:text-gray-400'>
                      {values.careActivityBundle[item.id].length} / {item.careActivities.length}{' '}
                      selection
                    </p>
                  </div>
                </label>
              );
            })
          ) : (
            <p className='text-center text-sm mt-4'>No available Care Activity Bundles.</p>
          )}
        </div>
      </div>
    </div>
  );
};
