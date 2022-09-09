import type { NextPage } from 'next';
import 'reflect-metadata';
import { Header, Sidebar} from '@components';
import {Planning} from './Planning';

const Home: NextPage = () => {
  return <>
    <div className="flex overflow-x-hidden h-screen mr-auto">
      <Sidebar />
      <div className="w-full p-4 flex-col">
        <Header />
        <Planning />
      </div>
    </div>
  </>
};

export default Home;
