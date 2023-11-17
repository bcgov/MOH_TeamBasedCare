import { faBookOpen, faList, faSuitcase } from '@fortawesome/free-solid-svg-icons';
import { AllowedPath } from 'src/common';
import { OccupationItemProps } from 'src/common/interfaces';
import { BackButtonLink } from '../BackButtonLink';
import { Disclosure } from '../Disclosure';
import { Card } from '../generic/Card';
import { Heading } from '../Heading';
import { OccupationalScopeRelatedResources } from './RelatedResources';
import { OccupationalScopeDetailsScopeOfPractice } from './scopeOfPractice';

interface OccupationalScopeDetailsProps {
  occupation?: OccupationItemProps;
}
export const OccupationalScopeDetails: React.FC<OccupationalScopeDetailsProps> = ({
  occupation,
}) => {
  return (
    <div className='mt-4'>
      {/* Back button */}
      <BackButtonLink path={AllowedPath.OCCUPATIONAL_SCOPE} />

      {/* occupation heading */}
      <Heading
        className='mt-2'
        title={occupation?.name}
        subTitle={occupation?.name ? `Full details about ${occupation?.name} profession.` : ''}
      />

      {/* Professional occupation card */}
      <Card bgWhite className='mt-4'>
        <Disclosure
          shouldExpand={true}
          btnIcon={faSuitcase}
          buttonText='Professional Description'
          content={occupation?.description || 'No description available'}
        />
      </Card>

      <Card bgWhite className='mt-4'>
        <Disclosure
          shouldExpand={true}
          btnIcon={faList}
          buttonText='Scope of practice'
          content={<OccupationalScopeDetailsScopeOfPractice occupation={occupation} />}
        />
      </Card>

      {Number(occupation?.relatedResources?.length) > 0 && (
        <Card bgWhite className='mt-4'>
          <Disclosure
            shouldExpand={true}
            btnIcon={faBookOpen}
            buttonText='Related resources'
            content={<OccupationalScopeRelatedResources occupation={occupation} />}
          />
        </Card>
      )}
    </div>
  );
};
