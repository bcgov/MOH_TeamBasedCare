import { useAuth } from '@services';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import 'reflect-metadata';
import { Spinner, SpinnerSize } from 'src/components/generic/Spinner';

const Landing: NextPage = () => {
  const router = useRouter();
  const query = router?.query;

  const { logMeIn, isAuthenticated, fetchAuthTokenFromCode, fetchUserFromCode } = useAuth();
  const [message, setMessage] = useState('Click here to Log in..');
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
    <>
      <h1 className='w-full text-bcBluePrimary p-40 text-center' onClick={logMeIn}>
        {message}
      </h1>
      <Spinner show={showSpinner} fullScreen={true} size={SpinnerSize.LG} />
    </>
  );
};

export default Landing;
