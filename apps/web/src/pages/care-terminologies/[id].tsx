import { useCareActivityCMSById } from '@services';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { Spinner } from 'src/components/generic/Spinner';
import { CareTerminologyDetails } from 'src/components/care-terminologies';

const CareTerminologyId: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { careActivity, isLoading } = useCareActivityCMSById(id);

  return (
    <AppLayout>
      <Spinner show={isLoading} fullScreen />
      {!isLoading && careActivity && <CareTerminologyDetails careActivity={careActivity} />}
    </AppLayout>
  );
};

export default CareTerminologyId;
