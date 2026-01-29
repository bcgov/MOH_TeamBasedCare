/**
 * Care Settings List Page
 *
 * Displays all care setting templates with search, pagination, and sorting.
 * Entry point for the care settings management feature.
 *
 * Actions:
 * - Edit: Opens edit wizard for non-master templates
 * - Create Copy: Creates a new template from any existing template
 */
import { Stepper } from '@components';
import { CareSettingTemplateRO } from '@tbcm/common';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { CareSettingsList } from 'src/components/care-settings';
import { Card } from 'src/components/generic/Card';
import { SearchBar } from 'src/components/generic/SearchBar';
import { useCareSettingsFind } from 'src/services/useCareSettingsFind';
import { useCareSettingTemplateCopy } from 'src/services/useCareSettingTemplateCopy';
import { CareSettingsSteps } from 'src/common/constants';

const CareSettingsPage: NextPage = () => {
  const router = useRouter();
  const {
    careSettings,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    onSearchTextChange,
    isLoading,
  } = useCareSettingsFind();

  const { handleCopy } = useCareSettingTemplateCopy();

  const onEditClick = (template: CareSettingTemplateRO) => {
    router.push(`/care-settings/${template.id}/edit`);
  };

  const onCopyClick = async (template: CareSettingTemplateRO) => {
    // Create copy with temporary name and navigate to edit wizard in copy mode
    const newTemplate = await handleCopy(template.id, {
      name: `${template.name} - Copy`,
    });
    if (newTemplate) {
      router.push(`/care-settings/${newTemplate.id}/edit?mode=copy`);
    }
  };

  return (
    <AppLayout>
      <div className='flex flex-1 flex-col gap-3 mt-5'>
        {/* Stepper */}
        <div className='w-full overflow-x-auto flex items-center justify-between rounded border-2 bg-white p-4'>
          <Stepper steps={CareSettingsSteps} currentStep={1} />
        </div>

        <Card bgWhite>
          <div className='mt-4'>
            <div className='flex gap-3 items-center justify-center'>
              <div className='flex-1'>
                <SearchBar
                  handleChange={e => onSearchTextChange(e.target.value)}
                  placeholderText='Search by care setting name'
                />
              </div>
            </div>
          </div>

          <div className='mt-4'>
            <CareSettingsList
              careSettings={careSettings}
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              onPageOptionsChange={onPageOptionsChange}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              isLoading={isLoading}
              onEditClick={onEditClick}
              onCopyClick={onCopyClick}
            />
          </div>
        </Card>
      </div>

    </AppLayout>
  );
};

export default CareSettingsPage;
