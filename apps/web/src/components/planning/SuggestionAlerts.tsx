import { SuggestionAlertRO } from '@tbcm/common';
import { Alert } from '../Alert';

interface SuggestionAlertsProps {
  alerts: SuggestionAlertRO[];
}

/**
 * Display a single consolidated warning banner for suboptimal suggestions.
 */
export const SuggestionAlerts: React.FC<SuggestionAlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  // Group alerts by type
  const alertsByType = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.type]) {
        acc[alert.type] = [];
      }
      acc[alert.type].push(alert);
      return acc;
    },
    {} as Record<string, SuggestionAlertRO[]>,
  );

  // Map alert types to user-friendly messages
  const getAlertMessage = (type: string, count: number) => {
    switch (type) {
      case 'LOW_MARGINAL_BENEFIT':
        return `${count} with low impact (<5% improvement)`;
      case 'NO_GAP_COVERAGE':
        return `${count} cannot fill any gaps`;
      case 'REDUNDANT_ONLY':
        return `${count} only add${count === 1 ? 's' : ''} redundancy`;
      default:
        return `${count} alert${count > 1 ? 's' : ''}`;
    }
  };

  const messages = Object.entries(alertsByType).map(([type, typeAlerts]) =>
    getAlertMessage(type, typeAlerts.length),
  );

  return (
    <Alert type='warning' className='text-sm'>
      <p>
        <span className='font-medium'>Some suggestions have limited value: </span>
        {messages.join(', ')}.
      </p>
    </Alert>
  );
};
