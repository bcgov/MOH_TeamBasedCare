import React from 'react';
import { useState } from 'react';
import logo from '@assets/img/bc_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faUsers, faBars } from '@fortawesome/free-solid-svg-icons';
import { SidebarButton } from './SidebarButton';
import { SidebarCollapsible } from './SidebarCollapsible';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const buttonsInit = [
    {
      id: '001',
      kind: 'regular',
      text: 'Resourcing',
      active: true,
      faIcon: faUsers,
    },
    {
      id: '002',
      kind: 'collapsible',
      text: 'Planning',
      active: false,
      faIcon: faClipboardList,
      options: [
        {
          id: '003',
          text: 'Create New',
          active: false,
        },
        {
          id: '004',
          text: 'All Plan',
          active: false,
        },
      ],
    },
    {
      id: '005',
      kind: 'regular',
      text: 'Testing Spacing',
      active: false,
      faIcon: faUsers,
    },
  ];
  const [buttons, setButtons] = useState(buttonsInit);

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
            {buttons.map(button => {
              if (button.kind === 'regular') {
                return (
                  <SidebarButton
                    key={button.id}
                    id={button.id}
                    setButtons={setButtons}
                    open={open}
                    active={button.active}
                    text={button.text}
                    faIcon={button.faIcon}
                  ></SidebarButton>
                );
              }
              if (button.kind === 'collapsible') {
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
                  ></SidebarCollapsible>
                );
              }
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
};
