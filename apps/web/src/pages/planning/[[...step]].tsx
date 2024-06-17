import { PlanningWrapper } from '@components';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { PlanningSteps } from 'src/common';

const Planning = () => {
  const router = useRouter();
  const { step } = router.query;
  // Build a map for each step in the planning process
  const mapPlan: { [key: number]: string } = {};
  PlanningSteps.forEach((plan, index) => (mapPlan[index + 1] = plan));

  return (
    <AppLayout>
      {/* Defaults to profile step to account for planning route without step*/}
      <PlanningWrapper initialStep={step ? +step : 1} />
    </AppLayout>
  );
};

export default Planning;
