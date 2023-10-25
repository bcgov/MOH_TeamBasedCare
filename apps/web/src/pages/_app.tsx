import Head from 'next/head';
import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import '../styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Team-based Care</title>
        <link rel='icon' href='/assets/img/bc_favicon.ico' />
      </Head>

      <main className='min-h-screen w-full bg-gray-100 text-gray-700'>
        <Component {...pageProps} />
      </main>
      <ToastContainer
        style={{ width: '30%', maxWidth: '675px' }}
        position='top-right'
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
