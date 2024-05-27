import { useMemo } from 'react';
import { OptionType } from 'src/components/generic/RenderSelect';
import { Spinner } from 'src/components/generic/Spinner';
import { BasicSelect } from 'src/components/Select';

interface CareSettingsFilterProps {
  isLoading: boolean;
  options: OptionType[];
  careSetting: string;
  onCareSettingChange: (value: string) => void;
}

export const CareSettingsFilter: React.FC<CareSettingsFilterProps> = ({
  isLoading,
  options,
  careSetting,
  onCareSettingChange,
}) => {
  const optionsWithHeader = useMemo(() => {
    return [{ label: 'Select care setting', value: '' }, ...options];
  }, [options]);

  if (isLoading) return <Spinner show sm />;

  return (
    <>
      <BasicSelect<string>
        id={`care-activities-cms-care-settings-filter`}
        options={optionsWithHeader}
        onChange={onCareSettingChange}
        value={careSetting}
        buttonClassName='min-w-[11rem]'
      />
    </>
  );
};
