import { usePlanningActivitiesGap } from '@services';
import { Card, CardColor } from 'src/components/generic/Card';

export const OverviewCards: React.FC = () => {
  const { initialValues } = usePlanningActivitiesGap();

  return (
    <div className='grid grid-cols-3 gap-8'>
      <Card
        color={CardColor.GREEN}
        title={initialValues?.overview?.inScope || ''}
        subtitle={'Within scope'}
      />
      <Card
        color={CardColor.YELLOW}
        title={initialValues?.overview?.needsTraining || ''}
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
