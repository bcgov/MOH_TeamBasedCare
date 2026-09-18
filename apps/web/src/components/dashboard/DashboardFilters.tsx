import { FilterDropdown } from '../FilterDropdown';
import { HeadlessListOptions } from '../HeadlessList';

export type DashboardFiltersProps =
  | {
      filterType: 'healthAuthority';
      healthAuthorityOptions: HeadlessListOptions<string>[];
      selectedHealthAuthority: string;
      onHealthAuthorityChange: (value: string) => void;
    }
  | {
      filterType: 'careSetting';
      careSettingOptions: HeadlessListOptions<string>[];
      selectedCareSetting: string;
      onCareSettingChange: (value: string) => void;
    };

export const DashboardFilters: React.FC<DashboardFiltersProps> = props => {
  if (props.filterType === 'healthAuthority') {
    return (
      <FilterDropdown
        label='Health Authority'
        options={props.healthAuthorityOptions}
        value={props.selectedHealthAuthority}
        onChange={props.onHealthAuthorityChange}
      />
    );
  }

  return (
    <FilterDropdown
      label='Care Setting'
      options={props.careSettingOptions}
      value={props.selectedCareSetting}
      onChange={props.onCareSettingChange}
    />
  );
};
