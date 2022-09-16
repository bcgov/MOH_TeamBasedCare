/* This example requires Tailwind CSS v2.0+ */
import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCog,
  faComment,
  faCaretDown,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@components';

export const Header = () => {
  const [accountDropdown, setAccountDropdown] = useState(false);
  return (
    <>
      <header className='flex w-full items-center justify-between border-b-2 border-gray-200'>
        <div className='flex items-center space-x-2'>
          <FontAwesomeIcon icon={faClipboardList} className='h-8 text-bcBluePrimary' />
          <h1 className='text-2xl text-bcBluePrimary flex-col items-start'>Planning</h1>
        </div>

        <div className='flex p-2'>
          <div className='flex flex-row items-start'>
            <a
              href='#'
              className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-white mr-4'
            >
              <FontAwesomeIcon border icon={faCog} className='h-4 text-bcBluePrimary' />
            </a>
            <a
              href='#'
              className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-white mr-4'
            >
              <FontAwesomeIcon icon={faComment} className='h-4 text-bcBluePrimary' />
            </a>
            <a
              href='#'
              className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-white mr-4'
            >
              <FontAwesomeIcon icon={faBell} className='h-4 text-bcBluePrimary' />
            </a>
          </div>
          <div className='border-r-2 border-grey-500 mr-4'></div>
          <div className='flex inline-flex items-center justify-center'>
            <div className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-bcBluePrimary text-white mr-4'>
              BP
            </div>
            <p className='text-bcBluePrimary'>Bob Loblaw</p>
            <Button
              classes='inline-flex items-center justify-center h-5 w-5 !p-0 overflow-hidden rounded-full bg-white ml-4'
              variant='default'
              type='button'
              onClick={() => setAccountDropdown(!accountDropdown)}
            >
              <FontAwesomeIcon icon={faCaretDown} className='h-4 text-bcBluePrimary' />
            </Button>
          </div>

          <div
            className={` ${
              !accountDropdown && 'hidden'
            } absolute right-2 mt-10 w-48 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-md`}
          >
            <div className='flex flex-col space-y-3 p-2'>
              <a href='#' className='transition hover:text-blue-600'>
                My Profile
              </a>
              <a href='#' className='transition hover:text-blue-600'>
                Edit Profile
              </a>
              <a href='#' className='transition hover:text-blue-600'>
                Settings
              </a>
            </div>

            <div className='p-2'>
              <button className='flex items-center space-x-2 transition hover:text-blue-600'>
                <FontAwesomeIcon icon={faCaretDown} className='h-4 text-bcBluePrimary' />
                <div>Log Out</div>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
