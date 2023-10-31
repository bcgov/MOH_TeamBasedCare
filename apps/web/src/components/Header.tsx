/* This example requires Tailwind CSS v2.0+ */
import React, { useMemo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UserDropdown } from './UserDropdown';
import { useAppContext } from './AppContext';

export const Header = () => {
  const { state } = useAppContext();

  const headerItem = useMemo(() => {
    return state.sidebarButtons?.find(item => item.path === state.activePath);
  }, [state.sidebarButtons, state.activePath]);

  return (
    <>
      <header className='flex w-full items-center justify-between border-b-2 border-gray-200'>
        <div className='flex items-center space-x-2'>
          {headerItem?.faIcon && (
            <FontAwesomeIcon icon={headerItem?.faIcon} className='h-8 text-bcBluePrimary' />
          )}
          <h1 className='text-2xl text-bcBluePrimary flex-col items-start'>{headerItem?.text}</h1>
        </div>

        <div className='flex p-2'>
          <div className='border-r-2 border-grey-500 mr-4'></div>

          <UserDropdown />
        </div>
      </header>
    </>
  );
};
