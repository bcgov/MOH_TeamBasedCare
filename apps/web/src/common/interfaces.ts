import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { PopoverPosition } from 'src/components/generic/Popover';
export interface CommonDBItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OccupationItemProps extends CommonDBItem {
  name: string;
  displayName: string;
  isRegulated: boolean;
  description: string;
}

export interface TooltipIconProps {
  text?: string;
  icon?: IconDefinition;
  meaning?: string;
  style?: string;
  position?: PopoverPosition;
}

export interface AllowedActivityByOccupation {
  id: string;
  careSetting: string;
  careActivityName: string;
  bundleName: string;
  permission: Permissions;
}
