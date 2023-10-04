import { useAuth } from '@services';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import 'reflect-metadata';
import { Footer } from 'src/components/Footer';
import { Card } from 'src/components/generic/Card';
import { Spinner } from 'src/components/generic/Spinner';
import { HeaderLanding } from 'src/components/HeaderLanding';

const Landing: NextPage = () => {
  const router = useRouter();
  const query = router?.query;

  const { logMeIn, isAuthenticated, fetchAuthTokenFromCode, fetchUserFromCode } = useAuth();
  const [message, setMessage] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  // convenient method for redirecting user to Home
  const redirectToHome = useCallback(() => {
    setShowSpinner(true);
    setMessage('Redirecting to home..');
    router.push('home');
  }, [router]);

  const fetchToken = useCallback(() => {
    const code = query?.code as string;

    if (!code) return;

    setShowSpinner(true);
    setMessage('Initiating Log in..');

    // fetch authentication token from the authorization code
    fetchAuthTokenFromCode(
      code,
      () => {
        setMessage('Authenticated. Fetching user information..');

        // fetch user data
        fetchUserFromCode(() => {
          // success callback - redirect to home page
          redirectToHome();
        });
      },
      () => {
        // error callback - show message
        setShowSpinner(false);
        setMessage('Failed to authenticate.. Please refresh page to retry...');
      },
      'Failed to authenticate the request...',
    );
  }, [fetchAuthTokenFromCode, fetchUserFromCode, query?.code, redirectToHome]);

  useEffect(() => {
    if (isAuthenticated()) {
      // if authenticated, move to home
      return redirectToHome();
    } else if (query?.code) {
      // if not, but has a code, move to fetch user
      return fetchToken();
    }
  }, [fetchToken, isAuthenticated, logMeIn, query?.code, redirectToHome]);

  return (
    <div className='h-screen flex flex-col'>
      <HeaderLanding />

      <main className='w-full flex-auto flex justify-center'>
        <div className='justify-center items-center flex flex-row gap-20 max-w-screen-lg p-10'>
          <div className='flex-1'>
            <h1 className='mb-3 font-bold text-4xl'>Welcome to Team based care mapping</h1>
            <p>
              The web application is designed to support professional practice by offering resource
              recommendations for both long-term planning and short-term resource assignments,
              ensuring the delivery of comprehensive health services across various care settings.
            </p>
          </div>

          <div className='flex-1'>
            <Card title='Sign In' extraSpacing>
              <p className='mt-4'>
                You will go to a secure website to log in and automatically return
              </p>
              <button
                className='bg-bcBluePrimary mt-4 p-4 text-white font-bold rounded'
                onClick={logMeIn}
              >
                Click here to sign in
              </button>
            </Card>
          </div>
        </div>
      </main>

      <Spinner show={showSpinner} fullScreen={true} message={message} />

      <Footer />
    </div>
  );
};

export default Landing;
