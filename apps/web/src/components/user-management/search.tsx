import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';

interface UserManagementSearchProps {
  onSearchTextChange: ({ text }: { text: string }) => void;
}

export const UserManagementSearch: React.FC<UserManagementSearchProps> = ({
  onSearchTextChange,
}) => {
  const handleSearch = (e: { target: { value: string } }) => {
    onSearchTextChange({ text: e.target.value });
  };

  const debouncedSearch = debounce(handleSearch, 500);

  return <SearchBar handleChange={debouncedSearch} placeholderText='Search' bgWhite />;
};
