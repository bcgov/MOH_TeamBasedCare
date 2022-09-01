import React from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';

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
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                className='h-6 w-6'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>
          </div>
        </div>

        <div className='relative'>
          <ul>
            <li className='left-0 flex items-center py-4 rounded-sm'>
              <a
                href='#'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-6 h-6 text-gray-100'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                  />
                </svg>

                <span className={open ? 'hidden' : 'text-gray-100'}>Home</span>
              </a>
            </li>

            <li className='left-0 flex items-center py-4 rounded-sm'>
              <a
                href='#'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-6 h-6 text-gray-100'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                  />
                </svg>

                <span className={open ? 'hidden' : 'text-gray-100'}>Home</span>
              </a>
            </li>
          </ul>
        </div>

        {/* <div className='flex-1'>
          <ul className='pt-2 pb-4 space-y-1 text-sm'>
            <li className='rounded-sm'>
              <a
                href='#'
                className={`${
                  open ? 'justify-center' : 'justify-left'
                } flex items-center p-1 space-x-3 rounded-md`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-6 h-6 text-gray-100'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                  />
                </svg>

                <span className={open ? 'hidden' : 'text-gray-100'}>Home</span>
              </a>
            </li>
          </ul>
        </div> */}
      </aside>
    </div>
  );
};
