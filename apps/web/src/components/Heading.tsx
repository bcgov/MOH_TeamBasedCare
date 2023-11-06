interface HeadingProps {
  title?: string;
  subTitle?: string;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, subTitle, className = '' }) => {
  return (
    <>
      {title && (
        <p className={`text-2xl font-bold text-gray-900 truncate dark:text-white ${className}`}>
          {title}
        </p>
      )}
      {subTitle && <p className='text-sm text-gray-500 dark:text-gray-400'>{subTitle}</p>}
    </>
  );
};
