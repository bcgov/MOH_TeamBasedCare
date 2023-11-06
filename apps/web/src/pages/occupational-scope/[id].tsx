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

  if (isLoading) {
    return <Spinner show={isLoading} fullScreen />;
  }

  return (
    <AppLayout title={occupation?.name}>
      <OccupationalScopeDetails occupation={occupation}></OccupationalScopeDetails>
    </AppLayout>
  );
};

export default OccupationalScopeId;
