import { useAuth } from '@services';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef } from 'react';
import { clearStorageAndRedirectToLandingPage } from 'src/utils/token';
import { Alert } from './Alert';
import { useAppContext } from './AppContext';
import { Header } from './Header';
import { SidebarButtonProps } from './interface';
import { Sidebar } from './Sidebar';
import { UserStatus } from '@tbcm/common';

const AppLayout: React.FC = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  const router = useRouter();
  const { state, updateSidebarButtons } = useAppContext();
  const { isAuthenticated, userRoles, userStatus, hasUserRole } = useAuth();

  // active sidebar button
  const activeSidebarButton = useRef<SidebarButtonProps | null>(null);

  // Find updated sidebar buttons activeness when app refreshes for the same url
  const updatedSidebarButtons = useMemo(
    () =>
      state.sidebarButtons.map(item => {
        if (item.path && router.pathname.includes(item.path)) {
          item.active = true;
          activeSidebarButton.current = item;
        } else {
          item.active = false;
        }

        return item;
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      // if the user is not authenticated anymore, clear storage and return to landing page
      clearStorageAndRedirectToLandingPage();
    }

    // update sidebar buttons activeness
    updateSidebarButtons(updatedSidebarButtons);
  }, [isAuthenticated, updateSidebarButtons, updatedSidebarButtons]);

  let accessError = '';

  /** if nav based role exist, and user does not have the required access */
  /** OR the sidebar nav is hidden */
  if (
    activeSidebarButton?.current?.hidden ||
    (activeSidebarButton?.current?.roles && !hasUserRole(activeSidebarButton?.current?.roles))
  ) {
    accessError = `You don't currently have permission to access this link.`;
  }

  /**
   * If a user does not have ANY role to view the application
   */
  if (userRoles?.length === 0) {
    accessError = `You don't currently have permissions to access the application.`;
  }

  if (userStatus === UserStatus.REVOKED) {
    accessError = `Your access was revoked. You no longer have permissions to access the application.`;
  }

  useEffect(() => {
    // to prevent "Error: Hydration failed because the initial UI does not match what was rendered on the server"
    setMounted(true);
  }, []);

  /**
   * App Layout is only accessible when the user is signed in. It acts as a Home screen
   */
  if (!isAuthenticated() || !mounted) {
    return null;
  }

  return (
    <div className='h-screen flex mr-auto' suppressHydrationWarning={true}>
      <Sidebar />
      <div className='flex flex-1 flex-col w-full p-3 overflow-auto'>
        <Header
          title={activeSidebarButton.current?.text}
          icon={activeSidebarButton.current?.faIcon}
        />
        {!accessError && children}
        {accessError && (
          <div className='flex justify-center mt-2'>
            <Alert type='warning'> {accessError} </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
