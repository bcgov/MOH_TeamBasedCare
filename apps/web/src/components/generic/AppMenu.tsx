import { useEffect, useRef, useCallback } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AppMenuItem {
  title: string;
  onClick?: () => void;
  icon?: IconProp;
  color?: 'red' | 'blue';
}

export interface AppMenuGroup {
  items: Array<AppMenuItem>;
}

interface AppMenuProps {
  handleMenuHide?: () => void;
  hideOnClick?: boolean;
  groups?: Array<AppMenuGroup>;
  size?: 'lg';
}

export const HIDE_MENU_DELAY = 100;

export const AppMenu: React.FC<AppMenuProps> = ({
  handleMenuHide,
  hideOnClick,
  groups = [],
  children,
  size,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Required for making the menu close on button click in the parent
  const extendedHandleMenuHide = useCallback(
    (event: MouseEvent, propagateEvent: boolean = false) => {
      if (propagateEvent) {
        event.stopPropagation();
      }
      if (handleMenuHide) {
        handleMenuHide();
      }
    },
    [handleMenuHide],
  );

  // Handles clicking outside of App Menu and closing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        extendedHandleMenuHide(event, true);
      }
    };

    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [extendedHandleMenuHide]);

  return (
    <>
      <div
        ref={ref}
        className={`absolute right-0 z-10 mt-2 ${
          size === 'lg' ? 'w-96' : 'w-64'
        } origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
        role='menu'
        aria-orientation='vertical'
        aria-labelledby='menu-button'
        tabIndex={-1}
      >
        {groups.map((group, j) => {
          return (
            <div className='p-1' role='none' key={j}>
              {(group?.items || []).map((item, i) => {
                return (
                  <div
                    key={i}
                    className='px-4 py-2 flex flex-column items-center hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                    onClick={() => {
                      item?.onClick?.();
                      if (hideOnClick) {
                        setTimeout(() => handleMenuHide?.(), HIDE_MENU_DELAY);
                      }
                    }}
                  >
                    {item?.icon && <FontAwesomeIcon className='w-4 h-4' icon={item.icon} />}
                    <a
                      href='#'
                      className={`text-gray-700 block px-4 py-2 text-sm ${
                        item.color === 'red'
                          ? 'text-bcRedError'
                          : item.color === 'blue'
                          ? 'text-bcBlueAccent'
                          : ''
                      }`}
                      role='menuitem'
                      tabIndex={-1}
                      id={`menu-item-${i}`}
                    >
                      {item.title}
                    </a>
                  </div>
                );
              })}
            </div>
          );
        })}

        {children}
      </div>
    </>
  );
};
