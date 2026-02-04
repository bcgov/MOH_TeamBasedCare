/* This example requires Tailwind CSS v2.0+ */
import React from 'react';

import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  title?: string;
  icon?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, icon }) => {
  return (
    <>
      <header className='flex w-full items-center justify-between border-b-2 border-gray-200'>
        <div className='flex items-center space-x-2'>
          {icon && <span className='h-8 w-8 text-bcBluePrimary'>{icon}</span>}
          <h1 className='text-2xl text-bcBluePrimary flex-col items-start'>{title}</h1>
        </div>

        <div className='flex p-2'>
          <div className='border-r-2 border-grey-500 mr-4'></div>

          <UserDropdown />
        </div>
      </header>
    </>
  );
};
