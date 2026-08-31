import { usePlanningContext } from '../../services/usePlanningContext';
import { SessionNameRenameControl } from './SessionNameRenameControl';

/**
 * Shows the open draft's title and rename action within planning steps 2–4.
 */
export const CurrentSessionName = () => {
  const {
    state: { sessionId, sessionName },
    updateSessionName,
  } = usePlanningContext();

  if (!sessionId || !sessionName) return null;

  return (
    <SessionNameRenameControl
      sessionId={sessionId}
      name={sessionName}
      onRenamed={updateSessionName}
      className='planning-session-title'
    />
  );
};
