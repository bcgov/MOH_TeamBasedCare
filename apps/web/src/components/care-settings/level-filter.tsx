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
      <label htmlFor='template-level-filter' className='sr-only'>
        Filter by template level
      </label>
      <select
        id='template-level-filter'
        value={value}
        onChange={e => onChange(e.target.value as TemplateLevelFilter)}
        className='px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:border-transparent'
      >
        {OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {`Template level: ${option.label}`}
          </option>
        ))}
      </select>
    </div>
  );
};
