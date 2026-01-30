/**
 * Care Settings List Page
 *
 * Displays all care setting templates with search, pagination, and sorting.
 * Entry point for the care settings management feature.
 *
 * Actions:
 * - Edit: Opens edit wizard for non-master templates
 * - Create Copy: Opens copy wizard for any template (copy created on save)
 * - Delete: Removes non-master templates after confirmation
 */
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Stepper } from '@components';
import { CareSettingTemplateRO } from '@tbcm/common';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { CareSettingsList } from 'src/components/care-settings';
import { Card } from 'src/components/generic/Card';
import { SearchBar } from 'src/components/generic/SearchBar';
import { ModalWrapper } from 'src/components/Modal';
import { useCareSettingsFind } from 'src/services/useCareSettingsFind';
import { useCareSettingTemplateDelete } from 'src/services/useCareSettingTemplateDelete';
import { useMe } from 'src/services/useMe';
import { CareSettingsSteps } from 'src/common/constants';

/**
 * Check if user can edit/delete a template based on health authority
 * - GLOBAL templates can be edited by anyone (master check handled separately)
 * - Templates belonging to user's HA can be edited
 * - Templates from other HAs cannot be edited
 */
const canModifyTemplate = (template: CareSettingTemplateRO, userOrganization?: string): boolean => {
  if (template.healthAuthority === 'GLOBAL') return true;
  if (!userOrganization) return false;
  return template.healthAuthority === userOrganization;
};

const CareSettingsPage: NextPage = () => {
  const router = useRouter();
  const { me } = useMe();
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
    onRefreshList,
  } = useCareSettingsFind();

  const { handleDelete, isLoading: isDeleting } = useCareSettingTemplateDelete();
  const [templateToDelete, setTemplateToDelete] = useState<CareSettingTemplateRO | null>(null);

  const onEditClick = (template: CareSettingTemplateRO) => {
    if (!canModifyTemplate(template, me?.organization)) {
      toast.error('You can only edit care settings belonging to your health authority.');
      return;
    }
    router.push(`/care-settings/${template.id}/edit`);
  };

  const onCopyClick = (template: CareSettingTemplateRO) => {
    // Navigate to copy wizard - copy is created only when user saves
    router.push(`/care-settings/copy?sourceId=${template.id}`);
  };

  const onDeleteClick = (template: CareSettingTemplateRO) => {
    if (!canModifyTemplate(template, me?.organization)) {
      toast.error('You can only delete care settings belonging to your health authority.');
      return;
    }
    setTemplateToDelete(template);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await handleDelete(templateToDelete, () => {
        setTemplateToDelete(null);
        onRefreshList();
      });
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
              onDeleteClick={onDeleteClick}
            />
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <ModalWrapper
          isOpen={!!templateToDelete}
          setIsOpen={() => setTemplateToDelete(null)}
          title='Delete Care Setting'
          description={
            <p>
              Are you sure you want to delete <strong>{templateToDelete.name}</strong>?
              This action cannot be undone.
            </p>
          }
          closeButton={{ title: 'Cancel' }}
          actionButton={{
            title: 'Delete',
            onClick: handleDeleteConfirm,
            isLoading: isDeleting,
            isError: true,
          }}
        />
      )}
    </AppLayout>
  );
};

export default CareSettingsPage;
