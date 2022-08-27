import Head from 'next/head';
import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Team based care mapping</title>
        <link rel='icon' href='/assets/img/bc_favicon.ico' />
      </Head>

      <main className='flex w-full justify-center pb-20'>
        <Component {...pageProps} />
      </main>
      <ToastContainer
        style={{ width: '50%' }}
        position='top-center'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  );
}

export default App;
