import type { NextPage } from 'next';
import 'reflect-metadata';
import { Form, Header, PageTitle, Sidebar } from '@components';

const Home: NextPage = () => {
  return <>
    <div className="flex overflow-x-hidden h-screen mr-auto">
      <Sidebar />
      <div className="w-full p-4 flex-col">
        <Header />
        <PageTitle title="Resource Planning" description="Planning resourcing plan based on skills and tasks within your unit."/>
        <Form />
      </div>
    </div>
  </>
};

export default Home;
