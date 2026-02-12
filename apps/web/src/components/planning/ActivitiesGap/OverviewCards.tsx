import { usePlanningActivitiesGap } from '@services';
import { Card, CardColor } from 'src/components/generic/Card';
import { Spinner } from 'src/components/generic/Spinner';

export const OverviewCards: React.FC = () => {
  const { initialValues, isLoading } = usePlanningActivitiesGap();
  const coverage = initialValues?.overview?.coverage;

  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      {coverage && (
        <Card
          color={CardColor.BLUE}
          title={`${coverage.coveragePercent}%`}
          subtitle={'Activities with capable staff'}
          className='hover:shadow-xl'
          tooltip={
            <div>
              <p className='font-semibold mb-2'>Activity Coverage</p>
              <ul className='list-disc pl-4 text-gray-600 space-y-1'>
                <li>{coverage.redundantCount} activities fully covered (2+ staff)</li>
                <li>{coverage.fragileCount} activities at risk (1 staff only)</li>
                <li>{coverage.gapsCount} gaps (no coverage)</li>
              </ul>
            </div>
          }
        />
      )}
      <Card
        color={CardColor.GREEN}
        title={initialValues?.overview?.inScope || ''}
        subtitle={'Within scope of practice'}
        className='hover:shadow-xl'
        tooltip={
          <div>
            <p className='font-semibold mb-2'>Team Capability Matrix</p>
            <p className='text-gray-600'>
              Percentage of cells where team members can perform activities with full scope (Y
              permission).
            </p>
          </div>
        }
      />
      <Card
        color={CardColor.YELLOW}
        title={initialValues?.overview?.limits || ''}
        subtitle={'With limits and conditions'}
        className='hover:shadow-xl'
        tooltip={
          <div>
            <p className='font-semibold mb-2'>Team Capability Matrix</p>
            <p className='text-gray-600'>
              Percentage of cells where team members can perform activities with limits and
              conditions (LC permission).
            </p>
          </div>
        }
      />
      <Card
        color={CardColor.RED}
        title={initialValues?.overview?.outOfScope || ''}
        subtitle={'Outside scope of practice'}
        className='hover:shadow-xl'
        tooltip={
          <div>
            <p className='font-semibold mb-2'>Team Capability Matrix</p>
            <p className='text-gray-600'>
              Percentage of cells where activities are outside the team&apos;s scope of practice.
            </p>
          </div>
        }
      />
    </div>
  );
};
