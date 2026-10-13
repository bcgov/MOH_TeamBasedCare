import { debounce } from 'lodash';
import { ReactNode, useState } from 'react';
import { SearchBar } from '../generic/SearchBar';

interface CareTerminologiesSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
  careSettingFilter?: ReactNode;
}

export const CareTerminologiesSearch: React.FC<CareTerminologiesSearchProps> = ({
  onSearchTextChange,
  careSettingFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    onSearchTextChange({ text });
  };

  const debouncedSearch = debounce(
    (e: { target: { value: string } }) => handleSearch(e.target.value),
    500,
  );

  return (
    <div className='flex flex-col p-4 gap-4 bg-white'>
      <p className='text-sm text-gray-600'>
        Understand what activities that can/cannot be performed by these occupations
      </p>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1 min-w-0'>
          <SearchBar
            value={searchTerm}
            handleChange={debouncedSearch}
            placeholderText='Search'
            bgWhite
            className='w-full'
          />
        </div>
        {careSettingFilter && <div className='shrink-0'>{careSettingFilter}</div>}
      </div>
    </div>
  );
};
