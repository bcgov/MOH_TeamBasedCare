import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

export interface SortButtonProps {
  label: string;
  name?: OccupationsFindSortKeys;
  sortKey?: OccupationsFindSortKeys;
  sortOrder?: SortOrder;
  onChange: ({ key }: { key: OccupationsFindSortKeys }) => void;
}

export const SortButton = ({ label, name, onChange, sortKey, sortOrder }: SortButtonProps) => {
  let sortIcon = faSort;
  if (name === sortKey) {
    switch (sortOrder) {
      case SortOrder.ASC:
        sortIcon = faSortUp;
        break;
      case SortOrder.DESC:
        sortIcon = faSortDown;
        break;
    }
  }

  return (
    <div className='flex align-middle'>
      <span>{label}</span>
      {name && (
        <button id={`sort-by-${sortKey}`} onClick={() => onChange({ key: name })} className='ml-2'>
          <FontAwesomeIcon className='h-3 w-3' icon={sortIcon} />
        </button>
      )}
    </div>
  );
};
