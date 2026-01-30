import { Tab, TabGroup, TabList } from '@headlessui/react';
import classNames from 'classnames';

interface ContentManagementTabsProps {
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const ContentManagementTabs: React.FC<ContentManagementTabsProps> = ({
  selectedIndex,
  onChange,
}) => {
  const tabs = ['Care Activities', 'Occupational Scope'];

  return (
    <TabGroup selectedIndex={selectedIndex} onChange={onChange}>
      <TabList className='flex space-x-1 border-b border-gray-200'>
        {tabs.map((tab, index) => (
          <Tab
            key={tab}
            className={({ selected }) =>
              classNames(
                'px-4 py-2 text-sm font-medium leading-5 focus:outline-none',
                selected
                  ? 'text-bcBluePrimary border-b-2 border-bcBluePrimary'
                  : 'text-gray-500 hover:text-bcBluePrimary',
              )
            }
          >
            {tab}
          </Tab>
        ))}
      </TabList>
    </TabGroup>
  );
};
