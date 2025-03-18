import classNames from 'classnames';

interface HeadingProps {
  title?: string;
  subTitle?: string;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, subTitle, className = 'truncate' }) => {
  return (
    <>
      {title && (
        <p className={classNames('text-2xl font-bold text-gray-900 dark:text-white', className)}>
          {title}
        </p>
      )}
      {subTitle && <p className='text-sm text-gray-500 dark:text-gray-400'>{subTitle}</p>}
    </>
  );
};
