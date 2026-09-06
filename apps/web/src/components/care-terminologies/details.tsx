import { faBookOpen, faClipboardList, faList } from '@fortawesome/free-solid-svg-icons';
import { CareActivityCMSDetailRO } from '@tbcm/common';
import { AllowedPath } from 'src/common';
import { BackButtonLink } from '../BackButtonLink';
import { Disclosure } from '../Disclosure';
import { Heading } from '../Heading';
import { Card } from '../generic/Card';

interface CareTerminologyDetailsProps {
  careActivity: CareActivityCMSDetailRO;
}

const RequirementsPlaceholder = () => (
  <div className='p-2 pt-0 text-sm text-gray-700'>
    Requirements and considerations will be added in a future update.
  </div>
);

export const CareTerminologyDetails: React.FC<CareTerminologyDetailsProps> = ({ careActivity }) => {
  const relatedActivities =
    careActivity.bundle?.careActivities?.filter(activity => activity.id !== careActivity.id) ?? [];

  return (
    <div className='mt-4'>
      <BackButtonLink path={AllowedPath.CARE_TERMINOLOGIES} />

      <Heading className='mt-2' title={careActivity.name} />

      <Card bgWhite className='mt-4'>
        <Disclosure
          shouldExpand
          btnIcon={faBookOpen}
          buttonText='Description'
          content={
            <div className='p-2 pt-0 text-sm text-gray-700'>
              {careActivity.description || 'No description available.'}
            </div>
          }
        />
      </Card>

      <Card bgWhite className='mt-4'>
        <Disclosure
          shouldExpand
          btnIcon={faClipboardList}
          buttonText='Requirements and Considerations'
          content={<RequirementsPlaceholder />}
        />
      </Card>

      <Card bgWhite className='mt-4'>
        <Disclosure
          shouldExpand
          btnIcon={faList}
          buttonText='Related Activities'
          content={
            relatedActivities.length > 0 ? (
              <ul className='list-disc space-y-2 p-2 pt-0 pl-7 text-sm text-gray-700'>
                {relatedActivities.map(activity => (
                  <li key={activity.id}>{activity.name}</li>
                ))}
              </ul>
            ) : (
              <div className='p-2 pt-0 text-sm text-gray-700'>No related activities available.</div>
            )
          }
        />
      </Card>
    </div>
  );
};
