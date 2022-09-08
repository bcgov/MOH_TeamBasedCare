import type { NextPage } from 'next';
import 'reflect-metadata';
import {Form, Header}   from '@components';
import { Sidebar } from '../components/Sidebar';

const Home: NextPage = () => {
  return <>
      <Sidebar />
      <Header />
      <Form />
  </>
};

export default Home;
