import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

/**
 * a styled header that auto focuses when the step parameter changes
 */
export const PlanningStepHeader: React.FC = ({ children }) => {
  const router = useRouter();
  const step = Number(router.query.step);
  const headerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headerRef.current?.focus();
  }, [step]);

  return (
    <h1
      ref={headerRef}
      tabIndex={-1}
      className='text-bcBluePrimary text-center text-2xl focus:outline-none mb-5'
    >
      {children}
    </h1>
  );
};
