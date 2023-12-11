import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';

interface CareTerminologiesSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const CareTerminologiesSearch: React.FC<CareTerminologiesSearchProps> = ({
  onSearchTextChange,
}) => {
  const handleSearch = (e: { target: { value: string } }) => {
    onSearchTextChange({ text: e.target.value });
  };

  const debouncedSearch = debounce(handleSearch, 500);

  return <SearchBar handleChange={debouncedSearch} placeholderText='Search' bgWhite />;
};
