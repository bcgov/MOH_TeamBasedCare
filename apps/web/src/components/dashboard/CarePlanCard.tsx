import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';

export interface CarePlanCardProps {
  careSettingName: string;
  healthAuthority: string;
  count: number;
}

export const CarePlanCard: React.FC<CarePlanCardProps> = ({
  careSettingName,
  healthAuthority,
  count,
}) => {
  return (
    <div className='bg-white rounded shadow-md flex flex-col gap-6 pt-2 pb-4 px-4 h-full'>
      {/* Icon */}
      <div className='w-12 h-12 bg-[#f1f8fe] rounded-lg flex items-center justify-center'>
        <FontAwesomeIcon icon={faFile} className='w-6 h-6 text-bcBluePrimary' />
      </div>
      {/* Count */}
      <div className='text-[37px] font-bold text-bcBluePrimary leading-[52px]'>
        {count.toLocaleString()}
      </div>
      {/* Title and Description */}
      <div className='flex flex-col gap-1'>
        <div className='text-lg font-bold text-gray-900 leading-[30px]'>{careSettingName}</div>
        <div className='text-base text-[#606060] leading-[27px]'>
          Total number of care plans generated in {careSettingName}.
        </div>
      </div>
      {/* Health Authority */}
      <div className='text-xs font-bold text-bcBluePrimary leading-[18px]'>
        {healthAuthority.toUpperCase()}
      </div>
    </div>
  );
};
