/* This example requires Tailwind CSS v2.0+ */
import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { UserDropdown } from './UserDropdown';

export const Header = () => {
  return (
    <>
      <header className='flex w-full items-center justify-between border-b-2 border-gray-200'>
        <div className='flex items-center space-x-2'>
          <FontAwesomeIcon icon={faClipboardList} className='h-8 text-bcBluePrimary' />
          <h1 className='text-2xl text-bcBluePrimary flex-col items-start'>Planning</h1>
        </div>

        <div className='flex p-2'>
          <div className='border-r-2 border-grey-500 mr-4'></div>

          <UserDropdown />
        </div>
      </header>
    </>
  );
};
