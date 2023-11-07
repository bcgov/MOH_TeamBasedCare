import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { Spinner } from 'src/components/generic/Spinner';
import { OccupationalScopeDetails } from 'src/components/occupational-scope';
import { useOccupationById } from 'src/services/useOccupationById';

const OccupationalScopeId: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { occupation, isLoading } = useOccupationById(id);

  return (
    <AppLayout>
      <Spinner show={isLoading} fullScreen />
      {!isLoading && <OccupationalScopeDetails occupation={occupation}></OccupationalScopeDetails>}
    </AppLayout>
  );
};

export default OccupationalScopeId;
