import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import '../styles/globals.css';
import Layout from 'src/layouts/home-layout';
import { NextPage } from 'next';

function App({ Component, pageProps }: any) {
  const renderWithLayout =
    Component.getLayout ||
    function (page: NextPage) {
      return <Layout>{page}</Layout>;
    };

  return (
    <>
      <Head>
        <title>Team based care mapping</title>
        <link rel='icon' href='/assets/img/bc_favicon.ico' />
      </Head>

      {renderWithLayout(<Component {...pageProps} />)}

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
