import { PropsWithChildren, useRef } from 'react';

/**
 * a styled header that auto focuses when the step parameter changes
 */
export const PlanningStepHeader: React.FC<PropsWithChildren> = ({ children }) => {
  const headerRef = useRef<HTMLHeadingElement>(null);

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
