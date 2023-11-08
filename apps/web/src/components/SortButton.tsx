import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SortOrder } from '@tbcm/common';

export interface SortButtonProps<T> {
  label: string;
  name?: T;
  sortKey?: T;
  sortOrder?: SortOrder;
  onChange: ({ key }: { key: T }) => void;
}

export const SortButton = <T,>({
  label,
  name,
  onChange,
  sortKey,
  sortOrder,
}: SortButtonProps<T>) => {
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
