import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { HeadlessListOptions } from '../HeadlessList';

export interface DashboardFiltersProps {
  healthAuthorityOptions: HeadlessListOptions<string>[];
  careSettingOptions: HeadlessListOptions<string>[];
  selectedHealthAuthority: string;
  selectedCareSetting: string;
  onHealthAuthorityChange: (value: string) => void;
  onCareSettingChange: (value: string) => void;
  showHealthAuthorityFilter?: boolean;
}

interface FilterDropdownProps {
  label: string;
  options: HeadlessListOptions<string>[];
  value: string;
  onChange: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, value, onChange }) => {
  const selectedLabel = options.find(o => o.value === value)?.label || 'All';

  return (
    <Listbox value={value} onChange={onChange}>
      <div className='relative'>
        <Listbox.Button className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary text-sm'>
          <span className='text-gray-700'>{label}:</span>
          <span className='font-medium text-gray-900'>{selectedLabel}</span>
          <FontAwesomeIcon icon={faFilter} className='text-bcBluePrimary w-3 h-3 ml-2' />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <Listbox.Options className='absolute mt-1 max-h-60 w-full min-w-[200px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10'>
            {options.map((option, index) => (
              <Listbox.Option
                key={index}
                value={option.value}
                className={({ selected }) =>
                  `cursor-pointer select-none py-2 px-4 ${
                    selected ? 'bg-gray-100 font-medium' : 'text-gray-900'
                  }`
                }
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  healthAuthorityOptions,
  careSettingOptions,
  selectedHealthAuthority,
  selectedCareSetting,
  onHealthAuthorityChange,
  onCareSettingChange,
  showHealthAuthorityFilter = true,
}) => {
  return (
    <div className='flex flex-wrap gap-4 mb-6'>
      {showHealthAuthorityFilter && (
        <FilterDropdown
          label='Filter by Health Authority'
          options={healthAuthorityOptions}
          value={selectedHealthAuthority}
          onChange={onHealthAuthorityChange}
        />
      )}
      <FilterDropdown
        label='Filter by Care Setting'
        options={careSettingOptions}
        value={selectedCareSetting}
        onChange={onCareSettingChange}
      />
    </div>
  );
};
