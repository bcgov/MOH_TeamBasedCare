import { tooltipIcons, TooltipIconTypes } from 'src/common';
import { TooltipIcon } from './generic/TooltipIcon';

// Delete this later, demo for TBCM-10 only
export const IconContaner = () => {
  return (
    <div className='mt-20'>
      <TooltipIcon {...tooltipIcons[TooltipIconTypes.GREEN_CHECKMARK]}></TooltipIcon>
      <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_CAUTION]}></TooltipIcon>
      <TooltipIcon {...tooltipIcons[TooltipIconTypes.RED_X]}></TooltipIcon>
      <TooltipIcon {...tooltipIcons[TooltipIconTypes.BLUE_QUESTION]}></TooltipIcon>
    </div>
  );
};
