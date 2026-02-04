export const CarePlanCardSkeleton: React.FC = () => (
  <div className='bg-white rounded shadow-md flex flex-col gap-6 pt-2 pb-4 px-4 h-full animate-pulse'>
    <div className='w-12 h-12 bg-gray-200 rounded-lg' />
    <div className='h-[52px] w-20 bg-gray-200 rounded' />
    <div className='flex flex-col gap-1'>
      <div className='h-[30px] w-40 bg-gray-200 rounded' />
      <div className='h-[27px] w-56 bg-gray-200 rounded' />
    </div>
    <div className='h-[18px] w-32 bg-gray-200 rounded' />
  </div>
);
