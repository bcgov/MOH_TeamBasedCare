import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { UserRole } from '@tbcm/common';
import { Dispatch, SetStateAction } from 'react';

export enum SidebarButtonKind {
  REGULAR = 'regular',
  COLLAPSIBLE = 'collapsible',
}

export interface SidebarButtonProps {
  id: string;
  kind?: SidebarButtonKind;
  open?: boolean;
  active: boolean;
  text: string;
  faIcon?: IconDefinition;
  setButtons?: Dispatch<SetStateAction<SidebarButtonProps[]>>;
  options?: SidebarButtonProps[];
  href?: string;
  roles?: Array<UserRole>;
}
