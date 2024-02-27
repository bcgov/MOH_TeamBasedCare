import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Role } from '@tbcm/common';
import { Dispatch, SetStateAction } from 'react';
import { AllowedPath } from 'src/common';

export enum SidebarButtonKind {
  REGULAR = 'regular',
  COLLAPSIBLE = 'collapsible',
  LINE_BREAK = 'line_break',
}

export interface SidebarButtonProps {
  id: string;
  kind?: SidebarButtonKind;
  open?: boolean;
  active?: boolean;
  path?: AllowedPath;
  text?: string;
  faIcon?: IconDefinition;
  setButtons?: Dispatch<SetStateAction<SidebarButtonProps[]>>;
  options?: SidebarButtonProps[];
  hidden?: boolean;
  roles?: Array<Role>;
}
