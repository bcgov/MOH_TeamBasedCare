/**
 * Care Settings Edit Wrapper Component
 *
 * Main container for the care settings edit wizard. Orchestrates the multi-step
 * flow for editing a care setting template.
 *
 * Steps:
 * 1. Select Care Competencies - Choose bundles and activities
 * 2. Finalize - Set occupation permissions for each activity
 *
 * Features:
 * - Loads template data, bundles, and occupations
 * - Tracks unsaved changes with confirmation dialog
 * - Error handling with user-friendly messages
 * - Stepper navigation with Previous/Next/Save buttons
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Stepper, Button } from '@components';
import { CareSettingsProvider, useCareSettingsContext } from './CareSettingsContext';
import { SelectCompetencies } from './select-competencies';
import { Finalize } from './finalize';
import { SaveNameModal } from './save-name-modal';
import { useCareSettingTemplate } from 'src/services/useCareSettingTemplate';
import { useCareSettingBundles } from 'src/services/useCareSettingBundles';
import { useCareSettingOccupations } from 'src/services/useCareSettingOccupations';
import { useCareSettingTemplateUpdate } from 'src/services/useCareSettingTemplateUpdate';
import { Spinner } from '../generic/Spinner';
import { Card } from '../generic/Card';
import { Permissions } from '@tbcm/common';
import { CareSettingsSteps } from 'src/common/constants';

const EditContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { state, dispatch, getPermissionsArray } = useCareSettingsContext();
  const { template, isLoading: isLoadingTemplate, error: templateError } = useCareSettingTemplate(id);
  const { bundles, isLoading: isLoadingBundles, error: bundlesError } = useCareSettingBundles(id);
  const { occupations, isLoading: isLoadingOccupations, error: occupationsError } = useCareSettingOccupations(id);
  const { handleUpdate, isLoading: isUpdating } = useCareSettingTemplateUpdate();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state when data loads
  useEffect(() => {
    if (template && bundles && occupations && !isInitialized) {
      const selectedBundleIds = new Set(template.selectedBundles?.map(b => b.bundleId) || []);
      const selectedActivityIds = new Set<string>();
      template.selectedBundles?.forEach(b => {
        b.selectedActivityIds?.forEach(id => selectedActivityIds.add(id));
      });

      const permissions = new Map<string, Permissions>();
      template.permissions?.forEach(p => {
        // Using :: as separator because UUIDs contain dashes
        permissions.set(`${p.activityId}::${p.occupationId}`, p.permission);
      });

      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          templateId: id,
          templateName: template.name,
          selectedBundleIds,
          selectedActivityIds,
          permissions,
          bundles,
          occupations,
          selectedBundleId: bundles.length > 0 ? bundles[0].id : null,
        },
      });
      setIsInitialized(true);
    }
  }, [template, bundles, occupations, id, dispatch, isInitialized]);

  // Track changes to mark form as dirty
  useEffect(() => {
    if (isInitialized) {
      setIsDirty(true);
    }
  }, [state.selectedBundleIds, state.selectedActivityIds, state.permissions]);

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Internal step 1 = Select Competencies (visual step 2)
  // Internal step 2 = Finalize (visual step 3)
  const visualStep = state.currentStep + 1;

  const handleNext = () => {
    if (state.currentStep < 2) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
    }
  };

  const handlePrevious = useCallback(() => {
    if (state.currentStep === 1) {
      // Going back to list page - warn about unsaved changes
      if (isDirty) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?',
        );
        if (!confirmLeave) return;
      }
      router.push('/care-settings');
    } else {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  }, [state.currentStep, isDirty, router, dispatch]);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async (name: string) => {
    const updateData = {
      name,
      selectedBundleIds: Array.from(state.selectedBundleIds),
      selectedActivityIds: Array.from(state.selectedActivityIds),
      permissions: getPermissionsArray(),
    };

    const success = await handleUpdate(
      id,
      updateData,
      () => {
        // Success callback
        setShowSaveModal(false);
        setIsDirty(false); // Clear dirty flag before navigation
        router.push('/care-settings');
      },
      () => {
        // Error callback - keep modal open so user can retry
        // Toast error is already shown by the service
      },
    );

    // Only close modal if successful (redundant but safe)
    if (!success) {
      // Keep modal open on failure
    }
  };

  const isLoading = isLoadingTemplate || isLoadingBundles || isLoadingOccupations;
  const hasError = templateError || bundlesError || occupationsError;

  if (isLoading) {
    return <Spinner show={true} fullScreen />;
  }

  if (hasError) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>
          <p className='text-red-600 font-semibold mb-2'>Failed to load care setting data</p>
          <p className='text-gray-500 mb-4'>Please try again or contact support if the problem persists.</p>
          <Button variant='outline' onClick={() => router.push('/care-settings')}>
            Back to Care Settings
          </Button>
        </div>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>Template not found</div>
      </Card>
    );
  }

  // Get parent template name for subtitle
  const parentName = template.parentName || template.name;

  return (
    <div className='flex flex-1 flex-col gap-3 mt-5'>
      {/* Stepper with navigation */}
      <div className='w-full overflow-x-auto flex items-center justify-between rounded border-2 bg-white p-4'>
        <Stepper steps={CareSettingsSteps} currentStep={visualStep} />
        <div className='flex'>
          <Button
            variant='outline'
            type='button'
            classes='ml-2'
            onClick={handlePrevious}
          >
            Previous
          </Button>

          {state.currentStep >= 2 ? (
            <Button
              variant='primary'
              type='button'
              classes='ml-2'
              onClick={handleSaveClick}
            >
              Save & Close
            </Button>
          ) : (
            <Button
              variant='primary'
              type='button'
              classes='ml-2'
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Title and subtitle */}
      <Card bgWhite>
        <h1 className='text-2xl font-bold text-bcBluePrimary'>Create Copy</h1>
        <p className='text-base text-gray-600 mt-1'>
          Copy created from: <span className='font-semibold'>{parentName}</span>
        </p>
        <p className='text-base text-gray-500 mt-2'>
          {state.currentStep === 1
            ? 'Select the Care Competencies and Activities'
            : 'Care Competencies and Corresponding Activities'}
        </p>
      </Card>

      <div className='flex-1 flex flex-col min-h-0'>
        {state.currentStep === 1 && <SelectCompetencies />}
        {state.currentStep === 2 && <Finalize />}
      </div>

      {showSaveModal && (
        <SaveNameModal
          isOpen={showSaveModal}
          setIsOpen={setShowSaveModal}
          currentName={state.templateName}
          onConfirm={handleSaveConfirm}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export const CareSettingsEditWrapper: React.FC = () => {
  return (
    <CareSettingsProvider>
      <EditContent />
    </CareSettingsProvider>
  );
};
