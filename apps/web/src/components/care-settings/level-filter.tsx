/**
 * Template Level Filter
 *
 * Narrows the care settings table to one tier. Sits directly below the search
 * bar and composes with it - changing the level never clears the search text.
 */
import {
  HEALTH_AUTHORITY_LEVEL_LABEL,
  PROVINCIAL_LEVEL_LABEL,
  SITE_LEVEL_LABEL,
  TemplateLevelFilter,
} from '@tbcm/common';
import { FilterDropdown } from '../FilterDropdown';

interface LevelFilterProps {
  value: TemplateLevelFilter;
  onChange: (value: TemplateLevelFilter) => void;
}

const OPTIONS: { value: TemplateLevelFilter; label: string }[] = [
  { value: TemplateLevelFilter.ALL, label: 'All' },
  { value: TemplateLevelFilter.PROVINCIAL, label: PROVINCIAL_LEVEL_LABEL },
  { value: TemplateLevelFilter.HEALTH_AUTHORITY, label: HEALTH_AUTHORITY_LEVEL_LABEL },
  { value: TemplateLevelFilter.SITE, label: SITE_LEVEL_LABEL },
];

export const LevelFilter: React.FC<LevelFilterProps> = ({ value, onChange }) => {
  return (
    <div className='flex items-center gap-3'>
      <span className='font-bold text-sm' aria-hidden='true'>
        Filter by:
      </span>
      <FilterDropdown
        id='template-level-filter'
        label='Template level'
        options={OPTIONS}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
