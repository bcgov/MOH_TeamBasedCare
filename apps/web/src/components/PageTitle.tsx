export interface PageTitleProps {
  title: string;
  description: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description, children }) => {
  return (
    <div className="">
      <div className='flex items-center space-x-2 p-2'>
        {children}
        <h1 className='text-xl flex-col items-start'>{title}</h1>
      </div>
      <p className='text-sm text-gray-400 p-2'>{description}</p>
    </div>
  );
};
