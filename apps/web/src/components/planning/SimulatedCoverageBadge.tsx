import { SimulatedCoverageRO } from '@tbcm/common';
import { Popover } from '../generic/Popover';

interface SimulatedCoverageBadgeProps {
  simulatedCoverage: SimulatedCoverageRO;
}

/**
 * Badge showing marginal benefit with tooltip for coverage details.
 * Colors: green (>5%), yellow (1-5%), gray (<1%)
 */
export const SimulatedCoverageBadge: React.FC<SimulatedCoverageBadgeProps> = ({
  simulatedCoverage,
}) => {
  const { marginalBenefit, coveragePercent, gapsRemaining, fragileRemaining } = simulatedCoverage;

  // Determine badge color based on marginal benefit
  const getBadgeColor = () => {
    if (marginalBenefit >= 5) return 'bg-green-100 text-green-800 border-green-300';
    if (marginalBenefit >= 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const badgeText = marginalBenefit > 0 ? `+${marginalBenefit}%` : `${marginalBenefit}%`;

  return (
    <Popover
      title={
        <span
          className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeColor()} cursor-help`}
        >
          {badgeText}
        </span>
      }
      position='bottom-left'
    >
      {() => (
        <div className='bg-white p-3 min-w-[200px]'>
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
          </div>
        </div>
      )}
    </Popover>
  );
};
