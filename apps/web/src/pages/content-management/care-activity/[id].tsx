import { useCareActivityCMSById } from '@services';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { EditCareActivityForm } from 'src/components/content-management/care-activities';
import { Spinner } from 'src/components/generic/Spinner';

const CareCareActivityDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { careActivity, isLoading } = useCareActivityCMSById(id);

  return (
    <AppLayout>
      <Spinner show={isLoading} fullScreen />
      {!isLoading && !!careActivity && <EditCareActivityForm careActivity={careActivity} />}
    </AppLayout>
  );
};

export default CareCareActivityDetailPage;
