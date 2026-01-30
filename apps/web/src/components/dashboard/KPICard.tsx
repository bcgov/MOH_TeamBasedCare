import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface KPICardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: IconDefinition;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className='bg-white rounded shadow-md flex flex-col gap-6 pt-2 pb-4 px-4 h-full'>
      {/* Icon */}
      <div className='w-12 h-12 bg-[#f1f8fe] rounded-lg flex items-center justify-center'>
        <FontAwesomeIcon icon={icon} className='w-6 h-6 text-bcBluePrimary' />
      </div>
      {/* Value */}
      <div className='text-[37px] font-bold text-bcBluePrimary leading-[52px]'>
        {value.toLocaleString()}
      </div>
      {/* Title and Subtitle */}
      <div className='flex flex-col gap-1'>
        <div className='text-lg font-bold text-gray-900 leading-[30px]'>{title}</div>
        <div className='text-base text-[#606060] leading-[27px]'>{subtitle}</div>
      </div>
    </div>
  );
};
