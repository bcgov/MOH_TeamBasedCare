import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';

interface OccupationalScopeSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const OccupationalScopeSearch: React.FC<OccupationalScopeSearchProps> = ({
  onSearchTextChange,
}) => {
  const handleSearch = (e: { target: { value: string } }) => {
    onSearchTextChange({ text: e.target.value });
  };

  const debouncedSearch = debounce(handleSearch, 500);

  return (
    <SearchBar
      handleChange={debouncedSearch}
      placeholderText='Search for occupations, care activities that can/can not be performed'
      bgWhite
    />
  );
};
