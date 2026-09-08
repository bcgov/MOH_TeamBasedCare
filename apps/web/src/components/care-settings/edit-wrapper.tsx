/**
 * Care Settings Edit Wrapper Component
 *
 * Main container for the care settings edit wizard. Orchestrates the multi-step
 * flow for editing an existing (non-master) care setting template.
 *
 * For creating copies, use CareSettingsCopyWrapper instead.
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
import { toast } from 'react-toastify';
import { Stepper, Button } from '@components';
import { CareSettingsProvider, useCareSettingsContext } from './CareSettingsContext';
import { SelectCompetencies } from './select-competencies';
import { Finalize } from './finalize';
import { SaveNameModal } from './save-name-modal';
import { TemplateDetailsCard } from './template-details-card';
import { EditDetailsModal } from './edit-details-modal';
import { SaveConflictModal } from './save-conflict-modal';
import { useCareSettingTemplate } from 'src/services/useCareSettingTemplate';
import { useCareSettingBundles } from 'src/services/useCareSettingBundles';
import { useCareSettingOccupations } from 'src/services/useCareSettingOccupations';
import { useCareSettingTemplateUpdate } from 'src/services/useCareSettingTemplateUpdate';
import { useUpdateTemplateDetails } from 'src/services/useCareSettingTemplateDetailsUpdate';
import { useParentPermissions } from 'src/services/useCareSettingParentPermissions';
import {
  describeConflictAuthor,
  TemplateVersionConflict,
} from 'src/services/templateVersionConflict';
import { useMe } from 'src/services/useMe';
import { Spinner } from '../generic/Spinner';
import { Card } from '../generic/Card';
import {
  CareSettingTemplateDetailRO,
  Permissions,
  Role,
  TemplateLevel,
  UpdateCareSettingTemplateDTO,
} from '@tbcm/common';
import { CareSettingsSteps } from 'src/common/constants';

type TemplateDetails = { name: string; level: TemplateLevel };

/**
 * What the user last attempted, kept so Override can replay it against the
 * newer version. Details edits and full saves target different endpoints.
 */
type PendingOperation =
  | { kind: 'full'; payload: UpdateCareSettingTemplateDTO }
  | { kind: 'details'; payload: TemplateDetails };

const EditContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { state, dispatch, getPermissionsArray } = useCareSettingsContext();
  const { me, hasUserRole } = useMe();
  const {
    template,
    isLoading: isLoadingTemplate,
    error: templateError,
    mutate: mutateTemplate,
  } = useCareSettingTemplate(id);
  const { bundles, isLoading: isLoadingBundles, error: bundlesError } = useCareSettingBundles(id);
  const {
    occupations,
    isLoading: isLoadingOccupations,
    error: occupationsError,
  } = useCareSettingOccupations(id);
  const { handleUpdateWithConflict, isLoading: isUpdating } = useCareSettingTemplateUpdate();
  const { handleUpdateDetails, isLoading: isUpdatingDetails } = useUpdateTemplateDetails();
  const { parentPermissions } = useParentPermissions(id);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [detailsNameError, setDetailsNameError] = useState<string | undefined>();
  const [conflict, setConflict] = useState<TemplateVersionConflict | undefined>();
  // Held so Override can re-send exactly what the user tried to save. Details
  // edits and full saves hit different endpoints, so the operation is tagged.
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authorization when template loads
  useEffect(() => {
    if (template && me) {
      // Check if user can modify this template
      const isAdmin = hasUserRole([Role.ADMIN]);
      const canModify = isAdmin || template.healthAuthority === me.organization;

      if (template.isMaster) {
        toast.error('Master templates cannot be edited.');
        router.push('/care-settings');
        return;
      }

      if (!canModify) {
        toast.error('You can only edit care settings belonging to your health authority.');
        router.push('/care-settings');
      }
    }
  }, [template, me, router]);

  // Extracted so a post-conflict Reload can seed state from the freshly fetched
  // template directly, instead of waiting for an effect that may still be
  // looking at SWR's stale cached value.
  const initializeFromTemplate = useCallback(
    (source: CareSettingTemplateDetailRO) => {
      const selectedBundleIds = new Set(source.selectedBundles?.map(b => b.bundleId) || []);
      const selectedActivityIds = new Set<string>();
      source.selectedBundles?.forEach(b => {
        b.selectedActivityIds?.forEach(activityId => selectedActivityIds.add(activityId));
      });

      // Only load the template's own permissions — do NOT inherit from parent
      // N (no permission) is represented as absence of a row, and we cannot
      // distinguish "explicitly set to N" from "never set", so inheriting
      // from parent would silently override intentional N decisions.
      // Permission inheritance happens only at copy time (copyTemplate).
      const permissions = new Map<string, Permissions>();
      const permissionLimits = new Map<
        string,
        { limitId: string; restrictionDescription?: string }
      >();
      source.permissions?.forEach(p => {
        const key = `${p.activityId}::${p.occupationId}`;
        permissions.set(key, p.permission);
        if (p.limitId) {
          permissionLimits.set(key, {
            limitId: p.limitId,
            restrictionDescription: p.restrictionDescription ?? undefined,
          });
        }
      });

      dispatch({
        type: 'INITIALIZE_STATE',
        payload: {
          templateId: id,
          templateName: source.name,
          parentName: source.parentName ?? '',
          level: source.level ?? null,
          version: source.version ?? 0,
          selectedBundleIds,
          selectedActivityIds,
          permissions,
          permissionLimits,
          bundles,
          occupations,
          selectedBundleId: bundles.length > 0 ? bundles[0].id : null,
        },
      });
    },
    [bundles, occupations, id, dispatch],
  );

  // Initialize state when data loads
  useEffect(() => {
    if (template && bundles.length > 0 && occupations.length > 0 && !isInitialized) {
      initializeFromTemplate(template);
      setIsInitialized(true);
    }
  }, [template, bundles, occupations, isInitialized, initializeFromTemplate]);

  // Feed the parent baseline in separately: it arrives on its own request and
  // must not delay initialising the wizard.
  useEffect(() => {
    if (!parentPermissions) return;
    const map = new Map<string, Permissions>();
    parentPermissions.forEach(p => {
      map.set(`${p.activityId}::${p.occupationId}`, p.permission);
    });
    dispatch({ type: 'SET_PARENT_PERMISSIONS', payload: map });
  }, [parentPermissions, dispatch]);

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
    setShowConfirmModal(true);
  };

  const submitUpdate = useCallback(
    async (payload: UpdateCareSettingTemplateDTO) => {
      const result = await handleUpdateWithConflict(id, payload);

      if (result.status === 'success') {
        setConflict(undefined);
        setPendingOperation(undefined);
        setShowConfirmModal(false);
        setIsDirty(false);
        // Invalidate cache so next edit loads fresh data
        mutateTemplate();
        router.push('/care-settings');
        return;
      }

      if (result.status === 'conflict') {
        // Keep the payload so Override can resend it against the newer version.
        setPendingOperation({ kind: 'full', payload });
        setConflict(result.conflict);
      }
      // Ordinary errors keep the modal open so the user can retry.
    },
    [handleUpdateWithConflict, id, mutateTemplate, router],
  );

  const submitDetailsUpdate = useCallback(
    async (details: TemplateDetails, expectedVersion: number) => {
      const result = await handleUpdateDetails(id, { ...details, expectedVersion });

      if (result.status === 'success') {
        dispatch({ type: 'SET_TEMPLATE_DETAILS', payload: details });
        dispatch({ type: 'SET_VERSION', payload: result.template.version ?? expectedVersion + 1 });
        setConflict(undefined);
        setPendingOperation(undefined);
        setShowEditDetailsModal(false);
        mutateTemplate();
        return;
      }

      if (result.status === 'conflict') {
        // Same as a full save: retain the attempt so Override can replay it.
        setShowEditDetailsModal(false);
        setPendingOperation({ kind: 'details', payload: details });
        setConflict(result.conflict);
        return;
      }

      // A duplicate name belongs beside the field, not in a toast the user has to
      // map back to an input.
      setShowEditDetailsModal(true);
      setDetailsNameError(result.message);
    },
    [handleUpdateDetails, id, dispatch, mutateTemplate],
  );

  const handleSaveConfirm = async (name: string) => {
    await submitUpdate({
      name,
      selectedBundleIds: Array.from(state.selectedBundleIds),
      selectedActivityIds: Array.from(state.selectedActivityIds),
      permissions: getPermissionsArray(),
      expectedVersion: state.version,
    });
  };

  const handleOverride = async () => {
    if (!pendingOperation || !conflict) return;
    const { currentVersion } = conflict;
    setConflict(undefined);

    if (pendingOperation.kind === 'details') {
      await submitDetailsUpdate(pendingOperation.payload, currentVersion);
      return;
    }

    await submitUpdate({ ...pendingOperation.payload, expectedVersion: currentVersion });
  };

  const handleReload = async () => {
    // Discards the unsaved work deliberately; the dialog says so before we get here.
    setConflict(undefined);
    setPendingOperation(undefined);
    setShowConfirmModal(false);
    setShowEditDetailsModal(false);

    // Seed straight from the refetched template. Clearing `isInitialized` alone
    // would race the initialise effect, which sees SWR's still-cached stale
    // template first and then blocks the fresh one.
    const fresh = await mutateTemplate();

    if (fresh) {
      initializeFromTemplate(fresh);
      setIsInitialized(true);
      setIsDirty(false);
      return;
    }

    setIsInitialized(false);
  };

  const handleDetailsConfirm = async (details: TemplateDetails) => {
    setDetailsNameError(undefined);
    await submitDetailsUpdate(details, state.version);
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

  if (!template) {
    return (
      <Card bgWhite>
        <div className='text-center py-8'>Template not found</div>
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
        isSaved
        stepDescription={
          state.currentStep === 1
            ? 'Select the Care Competencies and Activities'
            : 'Care Competencies and Corresponding Activities'
        }
        onEditDetailsClick={() => {
          setDetailsNameError(undefined);
          setShowEditDetailsModal(true);
        }}
      />

      <div className='flex-1 flex flex-col min-h-0'>
        {state.currentStep === 1 && <SelectCompetencies />}
        {state.currentStep === 2 && <Finalize />}
      </div>

      {showConfirmModal && (
        <SaveNameModal
          isOpen={showConfirmModal}
          setIsOpen={setShowConfirmModal}
          currentName={state.templateName}
          onConfirm={handleSaveConfirm}
          isLoading={isUpdating}
        />
      )}

      {showEditDetailsModal && (
        <EditDetailsModal
          isOpen={showEditDetailsModal}
          setIsOpen={setShowEditDetailsModal}
          currentName={state.templateName}
          currentLevel={state.level}
          onConfirm={handleDetailsConfirm}
          isLoading={isUpdatingDetails}
          nameError={detailsNameError}
        />
      )}

      {conflict && (
        <SaveConflictModal
          isOpen={Boolean(conflict)}
          setIsOpen={() => setConflict(undefined)}
          authorDescription={describeConflictAuthor(conflict)}
          onReload={handleReload}
          onOverride={handleOverride}
          isLoading={isUpdating || isUpdatingDetails}
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
