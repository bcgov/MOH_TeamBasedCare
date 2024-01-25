import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { PopoverPosition } from 'src/components/generic/Popover';
export interface CommonDBItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OccupationalScopeRelatedResource {
  label: string;
  link?: string;
}
export interface OccupationItemProps extends CommonDBItem {
  name: string;
  displayName: string;
  isRegulated: boolean;
  description: string;
  relatedResources?: Array<OccupationalScopeRelatedResource>;
}

export interface TooltipIconProps {
  text?: string;
  icon?: IconDefinition;
  meaning?: string;
  style?: string;
  position?: PopoverPosition;
  textWithOccupation?: string;
  occupation?: string;
}

export interface AllowedActivityByOccupation {
  id: string;
  careSetting: string;
  careActivityName: string;
  bundleName: string;
  permission: Permissions;
}
