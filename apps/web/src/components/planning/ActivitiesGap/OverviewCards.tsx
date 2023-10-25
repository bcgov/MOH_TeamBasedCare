import { usePlanningActivitiesGap } from '@services';
import { Card, CardColor } from 'src/components/generic/Card';
import { Spinner } from 'src/components/generic/Spinner';

export const OverviewCards: React.FC = () => {
  const { initialValues, isLoading } = usePlanningActivitiesGap();

  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <div className='grid grid-cols-3 gap-8'>
      <Card
        color={CardColor.GREEN}
        title={initialValues?.overview?.inScope || ''}
        subtitle={'Within scope'}
      />
      <Card
        color={CardColor.YELLOW}
        title={initialValues?.overview?.limits || ''}
        subtitle={'Needs additional training'}
      />
      <Card
        color={CardColor.RED}
        title={initialValues?.overview?.outOfScope || ''}
        subtitle={'Out of scope'}
      />
    </div>
  );
};
