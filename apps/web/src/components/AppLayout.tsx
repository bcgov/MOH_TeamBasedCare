import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef } from 'react';
import { AllowedPath } from 'src/common';
import { useAppContext } from './AppContext';
import { Header } from './Header';
import { SidebarButtonProps } from './interface';
import { Sidebar } from './Sidebar';

const AppLayout: React.FC = ({ children }) => {
  const router = useRouter();
  const { state, updateActivePath, updateSidebarButtons } = useAppContext();

  // active sidebar button
  const activeSidebarButton = useRef<SidebarButtonProps | null>(null);

  // Find updated sidebar buttons activeness when app refreshes for the same url
  const updatedSidebarButtons = useMemo(
    () =>
      state.sidebarButtons.map(item => {
        if (item.path === router.pathname) {
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
        updateActivePath(router.pathname as AllowedPath);
      }
    }

    // update sidebar buttons activeness
    updateSidebarButtons(updatedSidebarButtons);
  }, [router.pathname, updateActivePath, updateSidebarButtons, updatedSidebarButtons]);

  return (
    <>
      <div className='h-screen flex mr-auto'>
        <Sidebar />
        <div className='flex flex-1 flex-col w-full p-3 overflow-auto'>
          <Header />
          {children}
        </div>
      </div>
    </>
  );
};

export default AppLayout;
