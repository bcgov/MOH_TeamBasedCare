import { Fragment, useCallback, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { OptionValueType, SelectOption } from 'src/common/select-options.constants';
import { Tag } from './generic/Tag';
import { TagVariants } from 'src/common';

export interface HeadlessListOptions<T extends OptionValueType> extends SelectOption<T> {
  tagVariant?: TagVariants;
}

export interface HeadlessListProps<T extends OptionValueType> {
  id: string;
  options: HeadlessListOptions<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  className?: string;
  isMulti?: boolean;
  menuPlacement?: 'bottom' | 'top';
}

export const HeadlessList = <T extends OptionValueType>({
  id,
  options,
  value,
  onChange,
  className = '',
  isMulti = false,
  menuPlacement = 'bottom',
}: HeadlessListProps<T>) => {
  const getOption = useCallback(
    (value: T) => options.find(option => option.value === value),
    [options],
  );

  const displayText = useCallback(
    (value: T) => {
      const option = getOption(value);
      return (option?.label || option?.value || '').toString();
    },
    [getOption],
  );

  const displayMulti = useCallback(
    (selectedValues: T[]) => {
      return (
        <div className='flex'>
          {selectedValues
            .sort(
              (v1, v2) =>
                options.map(o => o.value).indexOf(v1) - options.map(o => o.value).indexOf(v2),
            )
            .map(value => getOption(value))
            .map((option, i) => {
              return (
                <>
                  {option && (
                    <Tag
                      tagStyle={option.tagVariant || TagVariants.GRAY}
                      text={displayText(option.value)}
                      key={i}
                    />
                  )}
                </>
              );
            })}
        </div>
      );
    },
    [displayText, getOption, options],
  );

  const [selected, setSelected] = useState<T | T[]>(value);

  const onListBoxChange = (value: T | T[]) => {
    setSelected(value);
    onChange(value);
  };

  return (
    <div className={`w-full ${className}`}>
      <Listbox value={selected} onChange={onListBoxChange} multiple={isMulti}>
        <div className='relative'>
          <Listbox.Button
            id={id}
            className='relative min-h-[2.25rem] w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm'
          >
            <span className='block truncate'>
              {isMulti ? displayMulti(selected as T[]) : displayText(selected as T)}
            </span>
            <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
              <FontAwesomeIcon
                icon={faCaretDown}
                className='h-5 w-5 text-gray-400'
                aria-hidden='true'
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave='transition ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Listbox.Options
              className={`${
                menuPlacement === 'top' ? 'top-0 -translate-y-full' : ''
              } absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm`}
            >
              {options.map((option, index) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 ${isMulti ? 'pl-8' : 'pl-3'} pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                      >
                        {option.label || option.value}
                      </span>
                      {isMulti && selected ? (
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600'>
                          <FontAwesomeIcon icon={faCheck} className='w-3 h-3' aria-hidden={true} />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};
