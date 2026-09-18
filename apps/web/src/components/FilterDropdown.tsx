import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { HeadlessListOptions } from './HeadlessList';

interface FilterDropdownProps<T extends string> {
  id?: string;
  label: string;
  options: HeadlessListOptions<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export const FilterDropdown = <T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
}: FilterDropdownProps<T>) => {
  const selectedLabel = options.find(option => option.value === value)?.label ?? 'All';

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className='relative max-w-full'>
        <Listbox.Button
          id={id}
          type='button'
          className='flex max-w-full items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary text-sm disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <span className='text-gray-700'>{label}:</span>
          <span className='font-medium text-gray-900'>{selectedLabel}</span>
          <FontAwesomeIcon
            icon={faFilter}
            className='text-bcBluePrimary w-3 h-3 ml-2 shrink-0'
            aria-hidden='true'
          />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <Listbox.Options className='absolute mt-1 max-h-60 w-full min-w-[200px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10'>
            {options.map(option => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={({ selected, active }) =>
                  `cursor-pointer select-none py-2 px-4 text-gray-900 ${
                    selected || active ? 'bg-gray-100' : ''
                  } ${selected ? 'font-medium' : ''}`
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
