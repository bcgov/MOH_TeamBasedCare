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
        subtitle={'Within scope of practice'}
        className='hover:shadow-xl'
      />
      <Card
        color={CardColor.YELLOW}
        title={initialValues?.overview?.limits || ''}
        subtitle={'With limits and conditions'}
        className='hover:shadow-xl'
      />
      <Card
        color={CardColor.RED}
        title={initialValues?.overview?.outOfScope || ''}
        subtitle={'Outside scope of practice'}
        className='hover:shadow-xl'
      />
    </div>
  );
};
