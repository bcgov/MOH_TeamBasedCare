import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { EditOccupationForm } from 'src/components/content-management/occupations';
import { Spinner } from 'src/components/generic/Spinner';
import { useOccupationCMSById } from 'src/services/useOccupationCMSById';

const OccupationEditPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const isNew = id === 'new';

  const { occupation, isLoading } = useOccupationCMSById(isNew ? '' : id);

  return (
    <AppLayout>
      {!isNew && <Spinner show={isLoading} fullScreen />}
      {(isNew || (!isLoading && occupation)) && (
        <EditOccupationForm occupation={isNew ? undefined : occupation} isNew={isNew} />
      )}
    </AppLayout>
  );
};

export default OccupationEditPage;
