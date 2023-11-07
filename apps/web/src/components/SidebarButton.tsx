import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SidebarButtonProps } from './interface';
import { useAppContext } from './AppContext';

export const SidebarButton = ({ id, open, path, text, faIcon, active }: SidebarButtonProps) => {
  const { state, updateActivePath, updateSidebarButtons } = useAppContext();

  const handleClick = () => {
    // Update state
    if (updateSidebarButtons) {
      updateSidebarButtons(
        state.sidebarButtons.map(obj => {
          if (obj.id === id) {
            return { ...obj, active: true };
          }

          if (obj.options) {
            let parentActive = false;
            const newOptObj = obj.options.map((opt: SidebarButtonProps) => {
              if (opt.id === id) {
                parentActive = true;
                return { ...opt, active: true };
              }
              return { ...opt, active: false };
            });
            return { ...obj, active: parentActive, options: newOptObj };
          }

          return { ...obj, active: false };
        }),
      );
    }

    path && updateActivePath(path);
  };
  return (
    <li
      className={`${
        active ? 'bg-bcBluePrimary' : 'hover:bg-bcBlueBorder'
      } left-0 flex items-center py-4 rounded-md`}
      onClick={handleClick}
      title={text}
    >
      <a
        href='#'
        className={`${
          open ? 'justify-center' : 'justify-left px-2'
        } flex items-center p-1 space-x-3 rounded-md`}
      >
        {faIcon ? (
          <FontAwesomeIcon
            className={`${active ? 'text-gray-100' : 'text-gray-400'} w-6 h-6`}
            icon={faIcon}
          />
        ) : (
          ''
        )}

        <span className={`${open ? 'hidden' : ''} ${active ? 'text-gray-100' : 'text-gray-400'} `}>
          {text}
        </span>
      </a>
    </li>
  );
};
