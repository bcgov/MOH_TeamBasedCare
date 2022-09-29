import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
export interface CommonDBItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OccupationItemProps extends CommonDBItem {
  name: string;
  displayName: string;
  isRegulated: boolean;
}

export interface TooltipIconProps {
  text?: string;
  icon?: IconDefinition;
  meaning?: string;
  style?: string;
}
