import React from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { SidebarButton } from './SidebarButton';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarButtonKind } from './interface';
import { useAppContext } from './AppContext';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { state } = useAppContext();

  return (
    <aside
      className={`${
        open ? 'w-14' : 'w-60'
      } sidebar  top-0 bottom-0 lg:left-0 flex flex-col h-screen p-3 shadow duration-300 bg-bcDarkBlue`}
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
          {state.sidebarButtons
            .filter(button => !button.hidden)
            .map(button => {
              if (button.kind === SidebarButtonKind.REGULAR) {
                return <SidebarButton key={button.id} open={open} {...button}></SidebarButton>;
              }

              if (button.kind === SidebarButtonKind.COLLAPSIBLE) {
                return (
                  <SidebarCollapsible key={button.id} open={open} {...button}></SidebarCollapsible>
                );
              }
            })}
        </ul>
      </div>
    </aside>
  );
};
