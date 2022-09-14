import { PageTitle } from '@components';
import { planningFormBox, careActivitiesBundlesLeftSide } from '../../styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { LeftSideBarActivites } from '@components';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  return (<>
    <div className={planningFormBox}>
      <PageTitle 
        title={title} 
        description="Based on the your Profile selection, here are the list of activities that done by the selected care location profile. All the care acitivities are selected by default, please select or deselect base on your planning.">
       <FontAwesomeIcon icon={faClipboardList} className='h-8 text-bcBluePrimary' />
      </PageTitle>
      <LeftSideBarActivites title={title}/>
   
    </div>

   

 
    </>
  );
};
