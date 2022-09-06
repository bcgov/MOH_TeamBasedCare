import React from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faUsers, faBars } from '@fortawesome/free-solid-svg-icons';
import { SidebarButton } from './SidebarButton';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(true);

  return (
    <div className='flex overflow-x-hidden h-screen mr-auto'>
      <aside
        className={`${
          open ? 'w-14' : 'w-60'
        } sidebar fixed top-0 bottom-0 lg:left-0 flex flex-col h-screen p-3 shadow duration-300 bg-bcDarkBlue`}
        aria-label='Sidebar'
      >
        <div className='space-y-3 overflow-y-auto'>
          <div className='flex items-center justify-between'>
            <img
              src={logo.src}
              alt='Government of British Columbia'
              className={open ? 'w-0 duration-300' : 'w-36 duration-300'}
              height='45px'
            />
            <button
              className='p-1 text-white'
              onClick={() => {
                setOpen(!open);
              }}
            >
              <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faBars} />
            </button>
          </div>
        </div>

        <div className='py-14'>
          <ul>
            <SidebarButton open={open} text={'Resourcing'} faIcon={faUsers}></SidebarButton>

            <li className='left-0 flex flex-wrap items-center py-4 rounded-sm'>
              <button
                type='button'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                }}
                aria-controls='dropdownExample'
                data-collapse-toggle='dropdownExample'
              >
                <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faClipboardList} />

                <span className={open ? 'hidden' : 'text-gray-100'}>Planning</span>
              </button>
              <ul className={dropdownOpen || open ? 'hidden' : 'py-2 space-y-2 w-full'}>
                <li className='flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'>
                  <span className={open ? 'hidden' : 'text-gray-100'}>Create New</span>
                </li>
                <li className='flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'>
                  <span className={open ? 'hidden' : 'text-gray-100'}>All Plan</span>
                </li>
              </ul>
            </li>

            <SidebarButton open={open} text={'Testing Spacing'} faIcon={faUsers}></SidebarButton>
          </ul>
        </div>
      </aside>
    </div>
  );
};
