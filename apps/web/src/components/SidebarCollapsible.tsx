import React from 'react';
import { SidebarButton } from './SidebarButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

interface SidebarCollapsibleProps {
  id: string;
  open: boolean;
  active: boolean;
  text: string;
  faIcon: IconDefinition;
  setButtons: any;
  options: any;
}

export const SidebarCollapsible = ({
  setButtons,
  active,
  open,
  faIcon,
  options,
}: SidebarCollapsibleProps) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <li className={`left-0 flex flex-wrap items-center py-4 rounded-sm`}>
      <button
        type='button'
        className={`${open ? 'justify-center' : 'justify-left w-full text-clip overflow-hidden'} 
        ${active ? 'bg-bcBluePrimary' : 'hover:bg-bcBlueBorder'} 
        flex  p-1 space-x-3 rounded-md py-4 rounded-md`}
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
        }}
      >
        <FontAwesomeIcon
          className={`${active ? 'text-gray-100' : 'text-gray-400'} w-6 h-6`}
          icon={faIcon}
        />

        <span className={`${open ? 'hidden' : ''} ${active ? 'text-gray-100' : 'text-gray-400'}`}>
          Planning
        </span>

        <FontAwesomeIcon
          className={`${active ? 'text-gray-100' : 'text-gray-400'} w-6 h-6 ${
            open ? 'hidden' : ''
          }`}
          icon={dropdownOpen ? faCaretUp : faCaretDown}
        />
      </button>
      <ul
        className={
          !dropdownOpen || open ? 'hidden' : 'py-2 space-y-2 w-full flex flex-col p-2 pl-11'
        }
      >
        {options.map((option: any) => (
          <SidebarButton
            key={option.id}
            id={option.id}
            setButtons={setButtons}
            open={open}
            active={option.active}
            text={option.text}
          ></SidebarButton>
        ))}
      </ul>
    </li>
  );
};
