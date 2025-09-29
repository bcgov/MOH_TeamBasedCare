import { PropsWithChildren } from 'react';

interface LabelProps {
  htmlFor: string;
}

export const Label: React.FC<PropsWithChildren<LabelProps>> = ({ htmlFor, children }) => {
  return (
    <label htmlFor={htmlFor} className='block text-bcBlack text-base font-bold'>
      {children}
    </label>
  );
};
