import { useCareActivityById } from '@services';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { EditCareActivityForm } from 'src/components/content-management/care-activities';
import { Spinner } from 'src/components/generic/Spinner';

const CareCareActivityDetailPage: NextPage = () => {
  const router = useRouter();
  const { id, unitId } = router.query as { id: string; unitId: string };
  const { careActivity, isLoading } = useCareActivityById(id, unitId);

  return (
    <AppLayout>
      <Spinner show={isLoading} fullScreen />
      {!isLoading && !!careActivity && <EditCareActivityForm careActivity={careActivity} />}
    </AppLayout>
  );
};

export default CareCareActivityDetailPage;
