import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';

interface SidebarButtonProps {
  open: boolean;
  text: string;
  faIcon: IconDefinition;
}

export const SidebarButton = ({ open, text, faIcon }: SidebarButtonProps) => {
  return (
    <li className='left-0 flex items-center py-4 rounded-sm'>
      <a
        href='#'
        className={`${
          open ? 'justify-center' : 'justify-left'
        } flex items-center p-1 space-x-3 rounded-md`}
      >
        <FontAwesomeIcon className='w-6 h-6 text-gray-100' icon={faIcon} />

        <span className={open ? 'hidden' : 'text-gray-100'}>{text}</span>
      </a>
    </li>
  );
};
