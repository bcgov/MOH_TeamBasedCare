/**
 * Care Settings Edit Page
 *
 * Page wrapper for editing a care setting template.
 * Renders the multi-step edit wizard within the app layout.
 *
 * Route: /care-settings/[id]/edit
 */
import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { CareSettingsEditWrapper } from 'src/components/care-settings';

const CareSettingsEditPage: NextPage = () => {
  return (
    <AppLayout>
      <CareSettingsEditWrapper />
    </AppLayout>
  );
};

export default CareSettingsEditPage;
