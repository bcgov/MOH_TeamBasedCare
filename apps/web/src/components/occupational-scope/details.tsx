import { faSuitcase } from '@fortawesome/free-solid-svg-icons';
import { AllowedPath } from 'src/common';
import { OccupationItemProps } from 'src/common/interfaces';
import { BackButtonLink } from '../BackButtonLink';
import { Disclosure } from '../Disclosure';
import { Card } from '../generic/Card';
import { Heading } from '../Heading';

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

      {/* text 2xl name of occupation */}
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
          content={occupation?.description}
        />
      </Card>
    </div>
  );
};
