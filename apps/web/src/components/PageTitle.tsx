export interface PageTitleProps {
  title: string;
  description: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description, children }) => {
  return (
    <>
      <div className='flex items-center space-x-2'>
        {children}
        <h1 className='text-2xl flex-col items-start'>{title}</h1>
      </div>
      <p className='text-sm text-gray-400'>{description}</p>
    </>
  );
};
