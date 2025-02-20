import { PlanningWrapper } from '@components';
import AppLayout from 'src/components/AppLayout';
import { pathMap } from 'src/common';
import { useRouter } from 'next/router';

const Planning = () => {
  const router = useRouter();
  const { step } = router.query;

  return (
    <AppLayout>
      {/* Defaults to profile step to account for planning route without step*/}
      <PlanningWrapper initialStep={step ? pathMap[step[0]] : 1} />
    </AppLayout>
  );
};

export default Planning;
