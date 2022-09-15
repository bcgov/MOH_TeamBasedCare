export interface PageTitleProps {
  title: string;
  description: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, description }) => {
  return (
    <>
      <h1
        tabIndex={-1}
        className='text-bcBluePrimary text-left text-4xl text-bold focus:outline-none mt-5'
      >
        {title}
      </h1>
      <p className='text-bcBluePrimary text-left'>{description}</p>
    </>
  );
};
