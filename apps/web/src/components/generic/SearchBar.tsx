import { MutableRefObject, useEffect, useRef } from 'react';

interface SearchBarProps {
  placeholderText?: string;
  handleChange?: ({ target }: React.ChangeEvent<HTMLInputElement>) => void;
  bgWhite?: boolean;
  value?: string;
  ref?: MutableRefObject<HTMLInputElement | null>;
  className?: string;
}

export const SearchBar = ({
  placeholderText = 'Search',
  handleChange,
  bgWhite,
  value,
  className = '',
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value || '';
    }
  }, [inputRef.current, value]);

  return (
    <div className={className}>
      <div className='relative w-full'>
        <div className='flex absolute inset-y-0 left-0 items-center pointer-events-none'>
          <div className='pl-2 pr-1 border-r-2'>
            <svg
              aria-hidden='true'
              className='w-5 h-5 text-gray-500 dark:text-gray-400'
              fill='currentColor'
              viewBox='0 0 20 20'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                fillRule='evenodd'
                d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                clipRule='evenodd'
              ></path>
            </svg>
          </div>
        </div>
        <input
          type='text'
          id='simple-search'
          className={`${
            bgWhite ? 'bg-white-50' : 'bg-gray-50'
          } border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:${
            bgWhite ? 'bg-white-700' : 'bg-gray-700'
          } dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
          placeholder={placeholderText}
          onChange={handleChange}
          autoComplete='off'
          defaultValue={value}
          ref={inputRef}
          required
        />
      </div>
    </div>
  );
};
