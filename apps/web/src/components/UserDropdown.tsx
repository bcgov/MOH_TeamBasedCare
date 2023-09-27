import { useMemo, useState } from 'react';
import { Button } from './Button';
import { useAuth } from '@services';
import { AppStorage, StorageKeys } from 'src/utils/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { getInitials } from 'src/utils/string/initials';

const HIDE_MENU_DELAY = 100;

export const UserDropdown = () => {
  const { logMeOut } = useAuth();
  const authUserDisplayName = AppStorage.getItem(StorageKeys.DISPLAY_NAME);

  const [showMenu, setShowMenu] = useState(false);

  const authInitials = useMemo(() => {
    return getInitials(authUserDisplayName);
  }, [authUserDisplayName]);

  const hideMenu = () => {
    setTimeout(() => setShowMenu(false), HIDE_MENU_DELAY);
  };

  if (!authUserDisplayName) return null;

  const logout = () => {
    logMeOut();
  };

  return (
    <div className='relative'>
      <div className='flex'>
        <Button
          classes='inline-flex items-center justify-center border-none'
          variant='default'
          type='button'
          onClick={() => setShowMenu(!showMenu)}
          onBlur={hideMenu}
        >
          <div className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-bcBluePrimary text-white mr-4'>
            {authInitials}
          </div>
          <p className='text-bcBluePrimary'>{authUserDisplayName}</p>
          <FontAwesomeIcon icon={faCaretDown} className='h-5 ml-2 text-bcBluePrimary' />
        </Button>
      </div>
      {showMenu && (
        <Button variant='outline' classes='absolute right-0 z-50' onClick={logout}>
          Logout
        </Button>
      )}
    </div>
  );
};
