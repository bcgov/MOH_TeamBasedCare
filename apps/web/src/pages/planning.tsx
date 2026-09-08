import { PlanningWrapper } from '@components';
import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { PlanningProvider } from 'src/components/planning/PlanningContext';

const Planning: NextPage = () => {
  return (
    <PlanningProvider>
      <AppLayout>
        <PlanningWrapper />
      </AppLayout>
    </PlanningProvider>
  );
};

export default Planning;
