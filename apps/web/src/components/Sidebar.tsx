import React, { useMemo } from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { SidebarButton } from './SidebarButton';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarButtonKind } from './interface';
import { sidebarNavItems } from '../common/constants';
import { AppStorage, StorageKeys } from 'src/utils/storage';
import _ from 'lodash';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [buttons, setButtons] = useState(sidebarNavItems);

  const userRoles = (useMemo(() => AppStorage.getItem(StorageKeys.ROLES), []) as string[]) || [];

  return (
    <div
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
          {buttons
            .filter(button => {
              if (!button.roles) return true; // permissive by default

              // else allow only if there is at-least one overlapping role
              return _.intersection(userRoles, button.roles || []).length > 0;
            })
            .map(button => {
              if (button.kind === SidebarButtonKind.REGULAR) {
                return (
                  <SidebarButton
                    key={button.id}
                    id={button.id}
                    setButtons={setButtons}
                    open={open}
                    active={button.active}
                    text={button.text}
                    faIcon={button.faIcon}
                    href={button.href}
                  ></SidebarButton>
                );
              }
              if (button.kind === SidebarButtonKind.COLLAPSIBLE) {
                return (
                  <SidebarCollapsible
                    key={button.id}
                    id={button.id}
                    setButtons={setButtons}
                    open={open}
                    active={button.active}
                    text={button.text}
                    faIcon={button.faIcon}
                    options={button.options}
                    href={button.href}
                  ></SidebarCollapsible>
                );
              }
            })}
        </ul>
      </div>
    </div>
  );
};
