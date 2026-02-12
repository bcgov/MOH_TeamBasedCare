import { SuggestionAlertRO } from '@tbcm/common';
import { Alert } from '../Alert';

interface SuggestionAlertsProps {
  alerts: SuggestionAlertRO[];
}

/**
 * Display warning alerts for suboptimal suggestions.
 * Groups alerts by type for cleaner presentation.
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
  const getAlertTitle = (type: string, count: number) => {
    switch (type) {
      case 'LOW_MARGINAL_BENEFIT':
        return `${count} suggestion${count > 1 ? 's' : ''} with low impact (<5% improvement)`;
      case 'NO_GAP_COVERAGE':
        return `${count} suggestion${count > 1 ? 's' : ''} cannot fill any gaps`;
      case 'REDUNDANT_ONLY':
        return `${count} suggestion${count > 1 ? 's' : ''} only add${count === 1 ? 's' : ''} redundancy`;
      default:
        return `${count} alert${count > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className='space-y-2'>
      {Object.entries(alertsByType).map(([type, typeAlerts]) => (
        <Alert key={type} type='warning' className='text-sm'>
          <p>{getAlertTitle(type, typeAlerts.length)}</p>
        </Alert>
      ))}
    </div>
  );
};
