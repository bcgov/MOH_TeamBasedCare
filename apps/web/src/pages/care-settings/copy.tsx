/**
 * Care Settings Copy Page
 *
 * Entry point for creating a copy of an existing care setting template.
 * Requires ?sourceId query parameter specifying the template to copy from.
 *
 * Unlike the edit page, the copy is NOT created in the database until
 * the user completes the wizard and confirms with a name.
 */
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AppLayout from 'src/components/AppLayout';
import { CareSettingsCopyWrapper } from 'src/components/care-settings';
import { Card } from 'src/components/generic/Card';
import { Button } from 'src/components/Button';

const CareSettingsCopyPage: NextPage = () => {
  const router = useRouter();
  const { sourceId } = router.query;

  // Wait for router to be ready
  if (!router.isReady) {
    return null;
  }

  // Validate sourceId is present
  if (!sourceId || typeof sourceId !== 'string') {
    return (
      <AppLayout>
        <div className='flex flex-1 flex-col gap-3 mt-5'>
          <Card bgWhite>
            <div className='text-center py-8'>
              <p className='text-red-600 font-semibold mb-2'>Missing source template</p>
              <p className='text-gray-500 mb-4'>No source template specified for copying.</p>
              <Button variant='outline' onClick={() => router.push('/care-settings')}>
                Back to Care Settings
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CareSettingsCopyWrapper />
    </AppLayout>
  );
};

export default CareSettingsCopyPage;
