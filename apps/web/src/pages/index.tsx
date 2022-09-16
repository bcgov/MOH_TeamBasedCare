import type { NextPage } from 'next';
import 'reflect-metadata';
import { Header, Sidebar } from '@components';
import { PlanningWrapper } from '@components';

const Home: NextPage = () => {
  return (
    <>
      <div className='flex overflow-x-hidden h-screen mr-auto'>
        <Sidebar />
        <div className='w-full p-3 flex-col'>
          <Header />
          <PlanningWrapper />
        </div>
      </div>
    </>
  );
};

export default Home;
