import { useEffect } from 'react';
import { usePlanningProfile } from './usePlanningProfile';
import { usePlanningContext } from './usePlanningContext';

/* The planning context resets when manually changing url or reload. 
   This makes sure the data is available
*/
export const usePlanningRefresh = () => {
  const { lastDraft, isLoading } = usePlanningProfile();
  const { updateSessionId } = usePlanningContext();

  useEffect(() => {
    if (!lastDraft?.id) return;
    updateSessionId(lastDraft.id);
  }, [lastDraft?.id]);

  return { isLoading };
};
