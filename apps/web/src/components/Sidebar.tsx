import React from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faUsers, faBars } from '@fortawesome/free-solid-svg-icons';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className='flex overflow-x-hidden h-screen'>
      <aside
        className={`${
          open ? 'w-14' : 'w-60'
        } sidebar fixed top-0 bottom-0 lg:left-0 flex flex-col h-screen p-3 shadow duration-300 bg-bcDarkBlue`}
        aria-label='Sidebar'
      >
        <div className='space-y-3'>
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
            <li className='left-0 flex items-center py-4 rounded-sm'>
              <a
                href='#'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
              >
                <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faUsers} />

                <span className={open ? 'hidden' : 'text-gray-100'}>Resourcing</span>
              </a>
            </li>

            <li className='left-0 flex items-center py-4 rounded-sm'>
              <a
                href='#'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
              >
                <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faClipboardList} />

                <span className={open ? 'hidden' : 'text-gray-100'}>Planning</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
