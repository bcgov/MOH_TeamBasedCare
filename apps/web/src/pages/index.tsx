import { useAuth } from '@services';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import 'reflect-metadata';
import { Spinner, SpinnerSize } from 'src/components/generic/Spinner';

const Landing: NextPage = () => {
  const router = useRouter();
  const query = router?.query;

  const { logMeIn, isAuthenticated, fetchAuthTokenFromCode } = useAuth();
  const [message, setMessage] = useState('Logging in...');
  const [showSpinner, setShowSpinner] = useState(true);

  // convenient method for redirecting user to Home
  const redirectToHome = useCallback(() => {
    router.push('home');
  }, [router]);

  if (isAuthenticated()) {
    // if authenticated, move to home
    redirectToHome();
  } else if (query?.code) {
    // if not, but has a code, move to fetch user
    const code = query?.code as string;

    // fetch authentication token from the authorization code
    fetchAuthTokenFromCode(
      code,
      () => {
        // success callback - redirect to home page
        redirectToHome();
      },
      () => {
        // error callback - show message
        setShowSpinner(false);
        setMessage('Failed to authenticate.. Please refresh page to retry...');
      },
    );
  } else {
    // else, redirect to login
    logMeIn();
  }

  return (
    <>
      <h1 className='w-full text-bcBluePrimary p-40 text-center'>{message}</h1>
      <Spinner show={showSpinner} fullScreen={true} size={SpinnerSize.LG} />
    </>
  );
};

export default Landing;
