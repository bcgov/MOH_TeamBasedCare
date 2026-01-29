/**
 * Care Settings Copy Wrapper Component
 *
 * Main container for the care settings copy wizard. Creates a new care setting
 * template based on an existing source template.
 *
 * Key difference from edit-wrapper: The copy is NOT created in the database
 * until the user completes the wizard and confirms. This prevents orphan records
 * and duplicate name issues.
 *
 * Steps:
 * 1. Select Care Competencies - Choose bundles and activities
 * 2. Finalize - Set occupation permissions for each activity
 *
 * Features:
 * - Loads SOURCE template data for reference
 * - Tracks unsaved changes with confirmation dialog
 * - Creates copy only on final confirmation
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
import { useCareSettingTemplateCopy } from 'src/services/useCareSettingTemplateCopy';
import { Spinner } from '../generic/Spinner';
import { Card } from '../generic/Card';
import { Permissions } from '@tbcm/common';
import { CareSettingsSteps } from 'src/common/constants';

const CopyContent: React.FC = () => {
  const router = useRouter();
  const { sourceId } = router.query as { sourceId: string };

  const { state, dispatch, getPermissionsArray } = useCareSettingsContext();
  // Load SOURCE template data (we're copying FROM this, not editing it)
  const { template: sourceTemplate, isLoading: isLoadingTemplate, error: templateError } = useCareSettingTemplate(sourceId);
  const { bundles, isLoading: isLoadingBundles, error: bundlesError } = useCareSettingBundles(sourceId);
  const { occupations, isLoading: isLoadingOccupations, error: occupationsError } = useCareSettingOccupations(sourceId);
  const { handleCopyWithData, isLoading: isCreating } = useCareSettingTemplateCopy();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from SOURCE template when data loads
  useEffect(() => {
    if (sourceTemplate && bundles.length > 0 && occupations.length > 0 && !isInitialized) {
      const selectedBundleIds = new Set(sourceTemplate.selectedBundles?.map(b => b.bundleId) || []);
      const selectedActivityIds = new Set<string>();
      sourceTemplate.selectedBundles?.forEach(b => {
        b.selectedActivityIds?.forEach(id => selectedActivityIds.add(id));
      });

      // Copy permissions from source template
      const permissions = new Map<string, Permissions>();
      sourceTemplate.permissions?.forEach(p => {
        // Using :: as separator because UUIDs contain dashes
        permissions.set(`${p.activityId}::${p.occupationId}`, p.permission);
      });

      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          templateId: '', // No template ID yet - copy not created
          templateName: sourceTemplate.name, // Source name for reference
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
  }, [sourceTemplate, bundles, occupations, dispatch, isInitialized]);

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
    const copyData = {
      name,
      selectedBundleIds: Array.from(state.selectedBundleIds),
      selectedActivityIds: Array.from(state.selectedActivityIds),
      permissions: getPermissionsArray(),
    };

    const result = await handleCopyWithData(sourceId, copyData);

    if (result) {
      setShowSaveModal(false);
      setIsDirty(false);
      router.push('/care-settings');
    }
    // If failed, keep modal open - error toast is shown by the service
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
          <p className='text-red-600 font-semibold mb-2'>Failed to load source template data</p>
          <p className='text-gray-500 mb-4'>Please try again or contact support if the problem persists.</p>
          <Button variant='outline' onClick={() => router.push('/care-settings')}>
            Back to Care Settings
          </Button>
        </div>
      </Card>
    );
  }

  if (!sourceTemplate) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>Source template not found</div>
      </Card>
    );
  }

  const sourceName = sourceTemplate.name;

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
          Copy created from: <span className='font-semibold'>{sourceName}</span>
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
          currentName=''
          onConfirm={handleSaveConfirm}
          isLoading={isCreating}
        />
      )}
    </div>
  );
};

export const CareSettingsCopyWrapper: React.FC = () => {
  return (
    <CareSettingsProvider>
      <CopyContent />
    </CareSettingsProvider>
  );
};
