import React from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { SidebarButton } from './SidebarButton';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarButtonKind } from './interface';
import { useAppContext } from './AppContext';
import { useAuth } from '@services';

export const Sidebar: React.FC = () => {
  const { state, toggleSidebarOpen } = useAppContext();
  const { userRoles } = useAuth();

  return (
    <aside
      className={`${
        state.sidebarOpen ? 'w-14' : 'w-60'
      } sidebar  top-0 bottom-0 lg:left-0 flex flex-col p-3 shadow duration-300 bg-bcDarkBlue`}
      aria-label='Sidebar'
    >
      <div className='space-y-3 overflow-y-auto'>
        <div className='flex items-center justify-between'>
          <img
            src={logo.src}
            alt='Government of British Columbia'
            className={state.sidebarOpen ? 'w-0 duration-300' : 'w-36 duration-300'}
            height='45px'
          />
          <button className='p-1 text-white' onClick={() => toggleSidebarOpen()}>
            <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faBars} />
          </button>
        </div>
      </div>

      <div className='py-14'>
        <ul>
          {state.sidebarButtons
            .filter(button => !button.hidden)
            .filter(button => {
              if (!button.roles) return true; // allow if no role is needed to view the menu item
              return userRoles.some(role => button.roles?.includes(role)); // if specified, filter the ones user has access to
            })
            .map(button => {
              if (button.kind === SidebarButtonKind.REGULAR) {
                return (
                  <SidebarButton
                    key={button.id}
                    open={state.sidebarOpen}
                    {...button}
                  ></SidebarButton>
                );
              }

              if (button.kind === SidebarButtonKind.COLLAPSIBLE) {
                return (
                  <SidebarCollapsible
                    key={button.id}
                    open={state.sidebarOpen}
                    {...button}
                  ></SidebarCollapsible>
                );
              }
            })}
        </ul>
      </div>
    </aside>
  );
};
