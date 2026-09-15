import { useFormikContext } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';
import { usePlanningContext } from './usePlanningContext';

export interface UsePlanningContentOptions {
  /**
   * The value fields that actually reach the draft. Stages that park view state in the
   * form — the Care Competencies stage keeps the competency the planner is looking at in
   * `careActivityID` — must name their real fields, otherwise browsing counts as an edit
   * and leaving the page writes a draft nobody changed. Omitted means every field counts.
   */
  persistedFields?: string[];
}

/**
 * Wires a wizard stage's form to the two moments a draft is written: pressing Next, and
 * leaving the page. Saving used to happen on Next only, so a planner who edited a stage
 * and then went to, say, the care setting templates page lost those edits.
 * Stage submit handlers must resolve true for a confirmed save and false for an API failure.
 */
export const usePlanningContent = ({ persistedFields }: UsePlanningContentOptions = {}) => {
  const { isSubmitting, submitForm, setSubmitting, validateForm, values, initialValues } =
    useFormikContext();
  const {
    state: { isNextTriggered, sessionId },
    updateWaitForValidation,
    updateProceedToNext,
    beginLeaveSave,
  } = usePlanningContext();
  const router = useRouter();

  /**
   * What the draft holds as far as this stage knows. Compared against the live values so a
   * planner who only looked around does not trigger a save, and so leaving right after a
   * Next does not save the same payload twice.
   *
   * Copied rather than referenced: the Care Competencies stage writes selections straight
   * into the values object instead of going through Formik, which would edit this baseline
   * too and leave every comparison reporting no change.
   */
  const savedValues = useRef<unknown>(cloneDeep(initialValues));

  // Read inside listeners, which are registered once and must not close over stale values.
  const latest = useRef({ values, sessionId, persistedFields, submitForm, setSubmitting });
  latest.current = { values, sessionId, persistedFields, submitForm, setSubmitting };

  // A reinitialize means the server state was (re)loaded, so it is the new baseline.
  useEffect(() => {
    savedValues.current = cloneDeep(initialValues);
  }, [initialValues]);

  const pendingSave = useRef<Promise<void> | null>(null);
  const save = useCallback(() => {
    if (pendingSave.current) return pendingSave.current;
    const submittedValues = cloneDeep(latest.current.values);
    const operation = (async () => {
      try {
        // Stage handlers return true only after the API confirms the write.
        // Formik forwards that result at runtime but declares submitForm as Promise<void>.
        const saved: unknown = await latest.current.submitForm();
        if (saved === true) {
          savedValues.current = submittedValues;
        }
      } finally {
        latest.current.setSubmitting(false);
        pendingSave.current = null;
      }
    })();
    pendingSave.current = operation;
    return operation;
  }, []);

  /** Whether the stage holds anything the draft does not, ignoring fields it never saves. */
  const hasUnsavedChanges = useCallback(() => {
    const saved = latest.current.persistedFields;
    const draftPart = (values: unknown) =>
      saved ? pick(values as Record<string, unknown>, saved) : values;

    return !isEqual(draftPart(latest.current.values), draftPart(savedValues.current));
  }, []);

  useEffect(() => {
    (async () => {
      if (!isNextTriggered) return;
      if (isSubmitting || pendingSave.current) {
        updateWaitForValidation();
        return;
      }

      // Next moves through the wizard; it is not itself an edit. Saving regardless meant
      // stepping back and forth announced "Changes saved automatically" over requests that
      // wrote nothing. A stage without a draft yet is exempt: that first save is what
      // creates it.
      if (latest.current.sessionId && !hasUnsavedChanges()) {
        const errors = await validateForm();

        if (Object.keys(errors).length === 0) {
          updateProceedToNext();
          return;
        }
        // Otherwise fall through, so submitting marks the fields and the planner is shown
        // why the wizard will not move on.
      }

      try {
        await save();
      } finally {
        updateWaitForValidation();
      }
    })();
  }, [isNextTriggered]);

  // Deduplicate a departure, not the lifetime of a stage that may survive cancellation.
  const hasLeft = useRef(false);

  useEffect(() => {
    const saveOnLeave = async () => {
      if (hasLeft.current) return;
      // Without a draft there is nothing to update: the first save belongs to Next, which
      // also names the draft, so navigating away must not create records on its own.
      if (!latest.current.sessionId) return;

      if (!hasUnsavedChanges() && !pendingSave.current) return;

      hasLeft.current = true;
      // The stage is on its way out, so the advance this save asks for on success must not
      // move the wizard on. Claimed before submitting because the result outlives both this
      // component and the route change, cancelled or not.
      const endLeaveSave = beginLeaveSave();
      try {
        if (pendingSave.current) {
          await pendingSave.current;
          if (!hasLeft.current || !hasUnsavedChanges()) return;
        }
        await save();
      } finally {
        endLeaveSave();
      }
    };
    const cancelDeparture = () => {
      hasLeft.current = false;
    };

    router.events?.on('routeChangeStart', saveOnLeave);
    router.events?.on('routeChangeError', cancelDeparture);

    return () => {
      router.events?.off('routeChangeStart', saveOnLeave);
      router.events?.off('routeChangeError', cancelDeparture);
    };
  }, [router.events, beginLeaveSave, hasUnsavedChanges, save]);
};
