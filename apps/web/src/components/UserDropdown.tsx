import { useMemo, useState } from 'react';
import { Button } from './Button';
import { useAuth, useMe } from '@services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { getInitials } from 'src/utils/string/initials';
import { AppMenu, AppMenuGroup } from './generic/AppMenu';
import { FeedbackForm } from './FeedbackForm';
import { ModalWrapper } from './Modal';
import { UserGuideList } from './user-guide/UserGuideList';

export const UserDropdown = () => {
  const { logMeOut } = useAuth();
  const { me } = useMe();

  const [showMenu, setShowMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);

  const authInitials = useMemo(() => {
    return getInitials(me?.displayName);
  }, [me?.displayName]);

  const logout = () => {
    logMeOut();
  };

  const onFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  const onUserGuideClick = () => {
    setShowUserGuideModal(true);
  };

  const handleMenuToggle = () => {
    setShowMenu(prev => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const dropdownMenuGroups: Array<AppMenuGroup> = [
    {
      items: [
        { title: 'Feedback', onClick: onFeedbackClick, color: 'blue' },
        { title: 'User manual', onClick: onUserGuideClick, color: 'blue' },
        { title: 'Logout', onClick: logout, color: 'red' },
      ],
    },
  ];

  if (!me) return null;

  return (
    <div className='relative'>
      <div className='flex'>
        <Button
          classes='inline-flex items-center justify-center border-none'
          variant='default'
          type='button'
          onClick={() => handleMenuToggle()}
        >
          <div className='inline-flex items-center justify-center h-9 w-9 overflow-hidden rounded-full bg-bcBluePrimary text-white mr-4'>
            {authInitials}
          </div>
          <p className='text-bcBluePrimary'>{me?.displayName}</p>
          <FontAwesomeIcon
            icon={faCaretDown}
            className={`h-5 ml-2 text-bcBluePrimary ${
              showMenu ? 'transform rotate-180 duration-300' : 'duration-300'
            }`}
          />
        </Button>
      </div>
      {showMenu && (
        <AppMenu hideOnClick={true} handleMenuHide={handleCloseMenu} groups={dropdownMenuGroups} />
      )}

      <ModalWrapper isOpen={showFeedbackModal} setIsOpen={setShowFeedbackModal} title={'Feedback'}>
        <div className='p-4'>
          <FeedbackForm setIsOpen={setShowFeedbackModal} />
        </div>
      </ModalWrapper>

      <ModalWrapper
        isOpen={showUserGuideModal}
        setIsOpen={setShowUserGuideModal}
        title={'User manual'}
        closeButton={{ title: 'Close' }}
      >
        <div className='p-4'>
          <UserGuideList />
        </div>
      </ModalWrapper>
    </div>
  );
};
