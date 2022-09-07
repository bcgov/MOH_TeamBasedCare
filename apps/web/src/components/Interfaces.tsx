import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { Dispatch, SetStateAction } from 'react';

export enum ButtonKind {
  REGULAR = 'regular',
  COLLAPSIBLE = 'collapsible',
}

export interface SidebarButtonProps {
  id: string;
  kind?: ButtonKind;
  open?: boolean;
  active: boolean;
  text: string;
  faIcon?: IconDefinition;
  setButtons?: Dispatch<SetStateAction<SidebarButtonProps[]>>;
  options?: SidebarButtonProps[];
}
