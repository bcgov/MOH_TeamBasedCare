export interface PageTitleProps {
  title: string;
  description?: string;
  secondaryChild?: React.ReactNode;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  description,
  children,
  secondaryChild,
}) => {
  return (
    <>
      <div className='flex items-center justify-between p-2'>
        <div className='flex space-x-2'>
          {children}
          <h1 className='text-xl font-bold text-bcBluePrimary flex-col items-start'>{title}</h1>
        </div>
        {secondaryChild}
      </div>
      {description && <p className='text-sm text-gray-400 p-2'>{description}</p>}
    </>
  );
};
