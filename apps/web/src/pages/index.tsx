import type { NextPage } from 'next';
import 'reflect-metadata';
import {Form, Header}   from '@components';


const Home: NextPage = () => {


  return <>
    {/* <p>Hello World</p> */}
    <Header />
    <Form />
  </>;
};

export default Home;
