import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';

interface ScopeOfPracticeSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const ScopeOfPracticeSearch: React.FC<ScopeOfPracticeSearchProps> = ({
  onSearchTextChange,
}) => {
  const handleSearch = (e: { target: { value: string } }) => {
    onSearchTextChange({ text: e.target.value });
  };

  const debouncedSearch = debounce(handleSearch, 500);

  return <SearchBar handleChange={debouncedSearch} placeholderText='Care activities' bgWhite />;
};
