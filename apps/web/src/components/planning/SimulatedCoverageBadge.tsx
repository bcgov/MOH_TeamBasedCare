import { SimulatedCoverageRO } from '@tbcm/common';
import { Popover } from '../generic/Popover';

interface SimulatedCoverageBadgeProps {
  simulatedCoverage: SimulatedCoverageRO;
  tier?: 1 | 2 | 3;
  redundancyGains?: number;
}

/**
 * Badge showing marginal benefit with tooltip for coverage details.
 * Colors: green (>5%), yellow (1-5%), gray/blue for redundancy (<1%)
 */
export const SimulatedCoverageBadge: React.FC<SimulatedCoverageBadgeProps> = ({
  simulatedCoverage,
  tier,
  redundancyGains,
}) => {
  const { marginalBenefit, coveragePercent, gapsRemaining, fragileRemaining } = simulatedCoverage;

  // Determine badge color based on marginal benefit or redundancy value
  const getBadgeColor = () => {
    if (marginalBenefit >= 5) return 'bg-green-100 text-green-800 border-green-300';
    if (marginalBenefit >= 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    // For 0% benefit but with redundancy value, use blue
    if (redundancyGains && redundancyGains > 0) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  // Get badge text - show redundancy info when coverage benefit is 0
  const getBadgeText = () => {
    if (marginalBenefit > 0) {
      return `+${marginalBenefit}%`;
    }
    // When 0% improvement, show redundancy value if available
    if (redundancyGains && redundancyGains > 0) {
      return `+${redundancyGains} backup`;
    }
    return '0%';
  };

  // Get tooltip explanation based on tier
  const getTooltipExplanation = () => {
    if (marginalBenefit > 0) {
      return null; // No extra explanation needed
    }
    if (tier === 2 && redundancyGains && redundancyGains > 0) {
      return `Adds backup coverage for ${redundancyGains} activit${redundancyGains === 1 ? 'y' : 'ies'} that currently ${redundancyGains === 1 ? 'has' : 'have'} only 1 capable staff member.`;
    }
    if (tier === 3) {
      return 'Adds flexibility by increasing overall team capability.';
    }
    return null;
  };

  const tooltipExplanation = getTooltipExplanation();

  return (
    <Popover
      title={
        <span
          className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor()} cursor-help`}
        >
          {getBadgeText()}
        </span>
      }
      position='bottom-left'
    >
      {() => (
        <div className='bg-white p-3 min-w-[220px]'>
          <p className='text-sm font-semibold text-gray-900 mb-2'>If added to team:</p>
          <div className='space-y-1 text-sm text-gray-700'>
            <p>
              Coverage: <span className='font-medium'>{coveragePercent}%</span>
            </p>
            <p>
              Gaps remaining: <span className='font-medium'>{gapsRemaining}</span>
            </p>
            <p>
              At-risk activities: <span className='font-medium'>{fragileRemaining}</span>
            </p>
            {redundancyGains !== undefined && redundancyGains > 0 && (
              <p>
                Backs up: <span className='font-medium'>{redundancyGains} activities</span>
              </p>
            )}
          </div>
          {tooltipExplanation && (
            <p className='mt-2 text-xs text-blue-700 border-t pt-2'>{tooltipExplanation}</p>
          )}
        </div>
      )}
    </Popover>
  );
};
