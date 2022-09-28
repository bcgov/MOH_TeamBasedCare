import type { NextPage } from 'next';
import 'reflect-metadata';
import { Header, Sidebar } from '@components';
import { PlanningWrapper } from '@components';

const Home: NextPage = () => {
  return (
    <>
      <div className='flex w-full overflow-x-hidden h-screen'>
        <Sidebar />
        <div className='h-screen flex flex-col flex-1 min-h-0 min-w-0 p-3'>
          <Header />
          <PlanningWrapper />
        </div>
      </div>
    </>
  );
};

export default Home;
