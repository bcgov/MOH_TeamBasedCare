import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const DropdownOptionBox = ({ options }: any) => {
  return (
    <div className='bg-white absolute left-0 z-10 mt-12 w-[400px] h-[350px] overflow-scroll rounded-md shadow-lg focus:outline-none'>
      <div className='py-1 flex flex-col' role='none'>
        {options ? (
          options
        ) : (
          <span className='text-gray-700 block px-4 py-2 text-sm'>No Options Provided</span>
        )}
      </div>
    </div>
  );
};

export const Dropdown = ({ options, children }: any) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const iconClass = 'w-3 h-3 ml-2';
  return (
    <div className='relative inline-block text-left flex'>
      <div className='flex align-middle'>
        <button
          type='button'
          className='flex items-center font-bold text-bcBlueLink justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none'
          id='menu-button'
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
          }}
          aria-expanded='true'
          aria-haspopup='true'
        >
          {children}
          {dropdownOpen ? (
            <FontAwesomeIcon className={iconClass} icon={faChevronUp}></FontAwesomeIcon>
          ) : (
            <FontAwesomeIcon className={iconClass} icon={faChevronDown}></FontAwesomeIcon>
          )}
        </button>
      </div>
      {dropdownOpen ? <DropdownOptionBox options={options} /> : null}
    </div>
  );
};
