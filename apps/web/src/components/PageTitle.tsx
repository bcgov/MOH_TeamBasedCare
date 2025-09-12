export interface PageTitleProps {
  title?: string;
  description?: string;
  secondary?: React.ReactElement;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description, secondary }) => {
  return (
    <div className='flex flex-col space-y-2'>
      {title && (
        <div className='flex items-center justify-between'>
          {title && (
            <h1 className='text-xl font-bold text-bcBluePrimary flex-col items-start'>{title}</h1>
          )}
          {secondary}
        </div>
      )}
      {description && <p className='text-sm text-gray-400'>{description}</p>}
    </div>
  );
};
