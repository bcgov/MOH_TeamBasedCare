import { PropsWithChildren } from 'react';

interface DescriptionProps {
  id: string;
}

export const Description: React.FC<PropsWithChildren<DescriptionProps>> = ({ id, children }) => {
  return (
    <span id={id} className='text-sm text-gray-500'>
      {children}
    </span>
  );
};
