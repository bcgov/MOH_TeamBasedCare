import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';
import { CareTerminologiesCommonSearchTerms } from './common-search-terms';
import { useRef, useState } from 'react';

interface CareTerminologiesSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const CareTerminologiesSearch: React.FC<CareTerminologiesSearchProps> = ({
  onSearchTextChange,
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
      <SearchBar
        value={searchTerm}
        handleChange={debouncedSearch}
        placeholderText='Search'
        bgWhite
      />
      <CareTerminologiesCommonSearchTerms handleSearch={handleSearch} />
    </div>
  );
};
