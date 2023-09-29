import { Header, Sidebar } from '@components';

const Layout = ({ children }: any) => {
  return (
    <main className='min-h-screen w-full bg-gray-100 text-gray-700'>
      <div className='flex overflow-x-hidden h-screen mr-auto'>
        <Sidebar />
        <div className='h-screen flex flex-col w-full p-3'>
          <Header />
          {children}
        </div>
      </div>
    </main>
  );
};

export default Layout;
