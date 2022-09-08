import type { NextPage } from 'next';
import 'reflect-metadata';
import { Form, Header } from '@components';
import { Sidebar } from '../components/Sidebar';

const Home: NextPage = () => {
  return <>
    <div className="flex overflow-x-hidden h-screen mr-auto">
      <Sidebar />
      <div className="w-full p-4 flex-col">
        <Header />
        <Form />
      </div>
    </div>
  </>
};

export default Home;
