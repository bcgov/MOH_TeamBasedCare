import { useMemo, useState } from 'react';
import { Button } from './Button';
import { useAuth } from '@services';
import { AppStorage, StorageKeys } from 'src/utils/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { getInitials } from 'src/utils/string/initials';
import { AppMenu, AppMenuGroup, HIDE_MENU_DELAY } from './generic/AppMenu';
import { ModalWrapper } from './Modal';

export const UserDropdown = () => {
  const { logMeOut } = useAuth();
  const authUserDisplayName = AppStorage.getItem(StorageKeys.DISPLAY_NAME);

  const [showMenu, setShowMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  const onFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  const sendFeedbackEmailClick = () => {
    window.open('mailto:kushal.arora1@ca.ey.com');
    setShowFeedbackModal(false);
  };

  const dropdownMenuGroups: Array<AppMenuGroup> = [
    {
      items: [
        { title: 'Feedback', onClick: onFeedbackClick, color: 'blue' },
        { title: 'Logout', onClick: logout, color: 'red' },
      ],
    },
  ];

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
          <FontAwesomeIcon
            icon={faCaretDown}
            className={`h-5 ml-2 text-bcBluePrimary ${
              showMenu ? 'transform rotate-180 duration-300' : 'duration-300'
            }`}
          />
        </Button>
      </div>
      {showMenu && <AppMenu groups={dropdownMenuGroups} />}

      <ModalWrapper
        isOpen={showFeedbackModal}
        setIsOpen={setShowFeedbackModal}
        title={'Feedback'}
        description={
          'Should you encounter any issues while using the application, please reach out by sending a message to us.'
        }
        closeButton={{ title: 'Cancel' }}
        actionButton={{ title: 'Send an email', onClick: sendFeedbackEmailClick }}
      />
    </div>
  );
};
