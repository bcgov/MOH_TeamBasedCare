interface LabelProps {
  htmlFor: string;
}

export const Label: React.FC<LabelProps> = ({ htmlFor, children }) => {
  return (
    <label htmlFor={htmlFor} className='block text-bcBlack text-base font-bold'>
      {children}
    </label>
  );
};
