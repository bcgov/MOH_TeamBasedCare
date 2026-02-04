import { Fragment, useCallback, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { OptionValueType, SelectOption } from 'src/common/select-options.constants';
import { Tag } from './generic/Tag';
import { TagVariants } from 'src/common';
import classNames from 'classnames';

export interface HeadlessListOptions<T extends OptionValueType> extends SelectOption<T> {
  tagVariant?: TagVariants;
}

export interface HeadlessListProps<T extends OptionValueType> {
  id: string;
  options: HeadlessListOptions<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  className?: string;
  buttonClassName?: string;
  isMulti?: boolean;
  menuPlacement?: 'bottom' | 'top' | 'right' | 'left';
}

export const HeadlessList = <T extends OptionValueType>({
  id,
  options,
  value,
  onChange,
  className = '',
  buttonClassName = '',
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

  const displaySingle = useCallback(
    (value: T) => {
      const option = getOption(value);
      if (option?.tagVariant) {
        return <Tag tagStyle={option.tagVariant} text={displayText(value)} />;
      }
      return displayText(value);
    },
    [getOption, displayText],
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
              return option ? (
                <Tag
                  key={i}
                  tagStyle={option.tagVariant || TagVariants.GRAY}
                  text={displayText(option.value)}
                />
              ) : null;
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

  const getPlacementStyle = () => {
    switch (menuPlacement) {
      case 'top':
        return 'top-0 -translate-y-full';
      case 'right':
        return 'right-0';
      case 'left':
        return '-left-1 top-1 -translate-x-full';
      default:
        return '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Listbox value={selected} onChange={onListBoxChange} multiple={isMulti}>
        <div className='relative'>
          <Listbox.Button
            id={id}
            className={`relative border border-gray-300 w-full cursor-default rounded bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus:border-bcBluePrimary focus:ring-1 focus:ring-bcBluePrimary sm:text-sm ${buttonClassName}`}
          >
            <span className='block truncate'>
              {isMulti ? displayMulti(selected as T[]) : displaySingle(selected as T)}
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
              className={classNames(
                'absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10',
                getPlacementStyle(),
              )}
            >
              {options.map((option, index) => (
                <Listbox.Option
                  key={index}
                  className={({ selected }) =>
                    `relative cursor-default select-none py-2 ${isMulti ? 'pl-8' : 'pl-3'} pr-4 ${
                      selected ? 'bg-gray-100 text-amber-900' : 'text-gray-900'
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
