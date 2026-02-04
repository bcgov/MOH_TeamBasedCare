import React from 'react';
import { SidebarButtonProps } from './interface';
import { useAppContext } from './AppContext';

export const SidebarButton = ({ id, open, path, text, icon, active }: SidebarButtonProps) => {
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

  // Collapsed state: 40x40 icon container with rounded corners
  if (!open) {
    return (
      <li
        className={`${
          active ? 'bg-bcBluePrimary/50' : 'hover:bg-bcBlueBorder'
        } w-10 h-10 flex items-center justify-center rounded-[5px] cursor-pointer`}
        onClick={handleClick}
        title={text}
      >
        {icon && (
          <span className={`${active ? 'text-gray-100' : 'text-gray-400'} w-6 h-6`}>{icon}</span>
        )}
      </li>
    );
  }

  // Expanded state
  return (
    <li
      className={`${
        active ? 'bg-bcBluePrimary' : 'hover:bg-bcBlueBorder'
      } left-0 flex items-center py-4 rounded-md cursor-pointer`}
      onClick={handleClick}
      title={text}
    >
      <a
        href='#'
        className='justify-left px-2 flex items-center p-1 space-x-3 rounded-md'
        onClick={e => e.preventDefault()}
      >
        {icon && (
          <span className={`${active ? 'text-gray-100' : 'text-gray-400'} w-6 h-6`}>{icon}</span>
        )}

        <span className={`${active ? 'text-gray-100' : 'text-gray-400'}`}>{text}</span>
      </a>
    </li>
  );
};
