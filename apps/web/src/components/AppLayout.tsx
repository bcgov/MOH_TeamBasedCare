import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { AllowedPath } from 'src/common';
import { useAppContext } from './AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const AppLayout: React.FC = ({ children }) => {
  const router = useRouter();
  const { state, updateActivePath, updateSidebarButtons } = useAppContext();

  useEffect(() => {
    // for folks refreshing the page or using the direct link to this page; Update the app context
    updateActivePath(router.pathname as AllowedPath);

    updateSidebarButtons(
      state.sidebarButtons.map(item => {
        if (item.path === router.pathname) {
          item.active = true;
        } else {
          item.active = false;
        }

        return item;
      }),
    );
  }, [router.pathname, state.sidebarButtons, updateActivePath, updateSidebarButtons]);

  return (
    <>
      <div className='flex overflow-x-hidden h-screen mr-auto'>
        <Sidebar />
        <div className='h-screen flex flex-col w-full p-3'>
          <Header />
          {children}
        </div>
      </div>
    </>
  );
};

export default AppLayout;
