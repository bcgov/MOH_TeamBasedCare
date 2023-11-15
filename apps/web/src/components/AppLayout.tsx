import { useAuth } from '@services';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef } from 'react';
import { AllowedPath } from 'src/common';
import { clearStorageAndRedirectToLandingPage } from 'src/utils/token';
import { Alert } from './Alert';
import { useAppContext } from './AppContext';
import { Header } from './Header';
import { SidebarButtonProps } from './interface';
import { Sidebar } from './Sidebar';

const AppLayout: React.FC = ({ children }) => {
  const router = useRouter();
  const { state, updateActivePath, updateSidebarButtons } = useAppContext();
  const { isAuthenticated, userRoles } = useAuth();

  // active sidebar button
  const activeSidebarButton = useRef<SidebarButtonProps | null>(null);

  // Find updated sidebar buttons activeness when app refreshes for the same url
  const updatedSidebarButtons = useMemo(
    () =>
      state.sidebarButtons.map(item => {
        if (router.pathname.includes(item.path)) {
          item.active = true;
          activeSidebarButton.current = item;
        } else {
          item.active = false;
        }

        return item;
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Update the app context when refreshing the page or using the direct link to this page;
  useEffect(() => {
    if (activeSidebarButton?.current) {
      if (activeSidebarButton.current.hidden) {
        // if the path is hidden, return to landing page
        updateActivePath(AllowedPath.LANDING);
      } else {
        // else, move to the supplied url
        updateActivePath(router.pathname);
      }
    }

    // update sidebar buttons activeness
    updateSidebarButtons(updatedSidebarButtons);
  }, [router.pathname, updateActivePath, updateSidebarButtons, updatedSidebarButtons]);

  /**
   * App Layout is only accessible when the user is signed in. It acts as a Home screen
   */
  if (!isAuthenticated()) {
    clearStorageAndRedirectToLandingPage();
    return <></>;
  }

  let accessError = '';

  /** if nav based role exist, and user does not have the required access */
  if (
    activeSidebarButton?.current?.roles &&
    !activeSidebarButton.current.roles?.some(role => userRoles.includes(role))
  ) {
    accessError = `You don't currently have permission to access this link.`;
  }

  /**
   * If a user does not have ANY role to view the application
   */
  if (userRoles?.length === 0) {
    accessError = `You don't currently have permission to access the application.`;
  }

  return (
    <>
      <div className='h-screen flex mr-auto'>
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
    </>
  );
};

export default AppLayout;
