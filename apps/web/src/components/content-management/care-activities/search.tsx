import { debounce } from 'lodash';
import { SearchBar } from '../../generic/SearchBar';

interface CareActivitiesCMSSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const CareActivitiesCMSSearch: React.FC<CareActivitiesCMSSearchProps> = ({
  onSearchTextChange,
}) => {
  const handleSearch = (e: { target: { value: string } }) => {
    onSearchTextChange({ text: e.target.value });
  };

  const debouncedSearch = debounce(handleSearch, 500);

  return (
    <SearchBar
      handleChange={debouncedSearch}
      placeholderText='Search for care activities'
      bgWhite
    />
  );
};
