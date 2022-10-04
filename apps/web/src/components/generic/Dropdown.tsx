import { CaretDownIcon } from './CaretDownIcon';

export const Dropdown = ({ children }: any) => {
  return (
    <div className='relative inline-block text-left'>
      <div className='flex'>
        <button
          type='button'
          className='inline-flex font-bold text-bcBlueLink justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100'
          id='menu-button'
          aria-expanded='true'
          aria-haspopup='true'
        >
          <span className=''>Occupation List</span>
          {children}
          <CaretDownIcon />
        </button>
      </div>
    </div>
  );
};
