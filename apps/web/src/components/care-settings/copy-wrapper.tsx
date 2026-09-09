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
import { EditDetailsModal } from './edit-details-modal';
import { TemplateDetailsCard } from './template-details-card';
import { useCareSettingTemplateForCopy } from 'src/services/useCareSettingTemplateForCopy';
import { useCareSettingBundles } from 'src/services/useCareSettingBundles';
import { useCareSettingOccupations } from 'src/services/useCareSettingOccupations';
import { useCareSettingTemplateCopy } from 'src/services/useCareSettingTemplateCopy';
import { useMe } from 'src/services/useMe';
import { Spinner } from '../generic/Spinner';
import { Card } from '../generic/Card';
import { Permissions, Role, TemplateLevel } from '@tbcm/common';
import { CareSettingsSteps } from 'src/common/constants';

const CopyContent: React.FC = () => {
  const router = useRouter();
  const { sourceId } = router.query as { sourceId: string };
  const { me, hasUserRole } = useMe();

  const { state, dispatch, getPermissionsArray } = useCareSettingsContext();
  // Load SOURCE template data (we're copying FROM this, not editing it)
  // Using lightweight endpoint that returns IDs only (avoids timeout on master templates)
  const {
    template: sourceTemplate,
    isLoading: isLoadingTemplate,
    error: templateError,
  } = useCareSettingTemplateForCopy(sourceId);
  const {
    bundles,
    isLoading: isLoadingBundles,
    error: bundlesError,
  } = useCareSettingBundles(sourceId);
  const {
    occupations,
    isLoading: isLoadingOccupations,
    error: occupationsError,
  } = useCareSettingOccupations(sourceId);
  const { handleCopyWithData, isLoading: isCreating } = useCareSettingTemplateCopy();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from SOURCE template when data loads
  useEffect(() => {
    if (sourceTemplate && bundles.length > 0 && occupations.length > 0 && !isInitialized) {
      // New lightweight hook returns IDs directly as arrays
      const selectedBundleIds = new Set(sourceTemplate.selectedBundleIds || []);
      const selectedActivityIds = new Set(sourceTemplate.selectedActivityIds || []);

      // Copy permissions from source template
      const permissions = new Map<string, Permissions>();
      const permissionLimits = new Map<
        string,
        { limitId: string; restrictionDescription?: string }
      >();
      sourceTemplate.permissions?.forEach(p => {
        // Using :: as separator because UUIDs contain dashes
        const key = `${p.activityId}::${p.occupationId}`;
        permissions.set(key, p.permission as Permissions);
        if (p.limitId) {
          permissionLimits.set(key, {
            limitId: p.limitId,
            restrictionDescription: p.restrictionDescription ?? undefined,
          });
        }
      });

      // The source template is this copy's parent, so it is also the baseline
      // the "Changes made by HA" badge compares against.
      const parentPermissionsMap = new Map(permissions);

      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          templateId: '', // No template ID yet - copy not created
          templateName: '', // The copy has no name of its own until it is saved
          parentName: sourceTemplate.name,
          hasParent: true,
          level: null,
          version: 0,
          selectedBundleIds,
          selectedActivityIds,
          permissions,
          permissionLimits,
          parentPermissions: parentPermissionsMap,
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
    setShowDetailsModal(true);
  };

  // Name and level are captured together: a copy cannot be persisted without
  // both, and the details dialog is the same one used to edit them later.
  const handleDetailsConfirm = async ({ name, level }: { name: string; level: TemplateLevel }) => {
    const copyData = {
      name,
      level,
      selectedBundleIds: Array.from(state.selectedBundleIds),
      selectedActivityIds: Array.from(state.selectedActivityIds),
      permissions: getPermissionsArray(),
    };

    const result = await handleCopyWithData(sourceId, copyData);

    if (result) {
      setShowDetailsModal(false);
      setIsDirty(false);
      router.push('/care-settings');
    }
    // If failed, keep modal open - error toast is shown by the service
  };

  const isLoading = isLoadingTemplate || isLoadingBundles || isLoadingOccupations;
  const hasError = templateError || bundlesError || occupationsError;

  // Check if user has required organization for creating copies
  // Admins can create GLOBAL templates without an organization
  const isAdmin = hasUserRole([Role.ADMIN, Role.CONTENT_ADMIN]);
  if (me && !me.organization && !isAdmin) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>
          <p className='text-red-600 font-semibold mb-2'>Health Authority Required</p>
          <p className='text-gray-500 mb-4'>
            You need a health authority assignment to create care setting copies. Please contact
            your administrator.
          </p>
          <Button variant='outline' onClick={() => router.push('/care-settings')}>
            Back to Care Settings
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return <Spinner show={true} fullScreen />;
  }

  if (hasError) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>
          <p className='text-red-600 font-semibold mb-2'>Failed to load source template data</p>
          <p className='text-gray-500 mb-4'>
            Please try again or contact support if the problem persists.
          </p>
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

  return (
    <div className='flex flex-1 flex-col gap-3 mt-5'>
      {/* Stepper with navigation */}
      <div className='w-full overflow-x-auto flex items-center justify-between rounded border-2 bg-white p-4'>
        <Stepper steps={CareSettingsSteps} currentStep={visualStep} />
        <div className='flex'>
          <Button variant='outline' type='button' classes='ml-2' onClick={handlePrevious}>
            Previous
          </Button>

          {state.currentStep >= 2 ? (
            <Button variant='primary' type='button' classes='ml-2' onClick={handleSaveClick}>
              Save & Close
            </Button>
          ) : (
            <Button variant='primary' type='button' classes='ml-2' onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>

      <TemplateDetailsCard
        templateName={state.templateName}
        parentName={state.parentName}
        level={state.level}
        isSaved={false}
        stepDescription={
          state.currentStep === 1
            ? 'Select the Care Competencies and Activities'
            : 'Care Competencies and Corresponding Activities'
        }
      />

      <div className='flex-1 flex flex-col min-h-0'>
        {state.currentStep === 1 && <SelectCompetencies />}
        {state.currentStep === 2 && <Finalize />}
      </div>

      {showDetailsModal && (
        <EditDetailsModal
          isOpen={showDetailsModal}
          setIsOpen={setShowDetailsModal}
          title='Care Setting Details'
          currentName=''
          onConfirm={handleDetailsConfirm}
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
