export interface PageTitleProps {
  title?: string;
  description?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => {
  return (
    <div className='flex flex-col space-y-2'>
      {title && (
        <div className='flex items-center justify-between'>
          {title && (
            <h1 className='text-xl font-bold text-bcBluePrimary flex-col items-start'>{title}</h1>
          )}
        </div>
      )}
      {description && <p className='text-sm text-gray-400'>{description}</p>}
    </div>
  );
};
