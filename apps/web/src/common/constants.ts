import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import {
  faClipboardList,
  faCheckCircle,
  faTimesCircle,
  faQuestionCircle,
  faExclamationCircle,
  faUsers,
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from './interfaces';
import { Role } from '@tbcm/common';

export enum AllowedPath {
  LANDING = '/',
  PLANNING = '/planning',
  OCCUPATIONAL_SCOPE = '/occupational-scope',
  OCCUPATIONAL_SCOPE_ID = '/occupational-scope/:id',
  CARE_TERMINOLOGIES = '/care-terminologies',
  CARE_TERMINOLOGIES_ID = '/care-terminologies/:id',
}

export const sidebarNavItems: SidebarButtonProps[] = [
  {
    id: '001',
    kind: SidebarButtonKind.REGULAR,
    text: 'Planning',
    active: false,
    faIcon: faClipboardList,
    path: AllowedPath.PLANNING,
    roles: [Role.USER],
  },
  {
    id: '002',
    kind: SidebarButtonKind.REGULAR,
    text: 'Occupational scope',
    active: false,
    faIcon: faUsers,
    path: AllowedPath.OCCUPATIONAL_SCOPE,
    hidden: false,
    roles: [Role.USER],
  },
  {
    id: '003',
    kind: SidebarButtonKind.REGULAR,
    text: 'Modal of Care Terminologies',
    active: false,
    faIcon: faBook,
    path: AllowedPath.CARE_TERMINOLOGIES,
    hidden: false,
    roles: [Role.USER],
  },
];

export const PlanningSteps = [
  'Profile',
  'Care Activity Bundles',
  'Occupations/Roles',
  'Gaps, Optimizations and Suggestions',
];

export enum TagVariants {
  BASE = 'tag',
  BLUE = 'tag-blue',
  GREEN = 'tag-green',
  YELLOW = 'tag-yellow',
  PURPLE = 'tag-purple',
  TEAL = 'tag-teal',
}

export enum ActivityTagVariants {
  ASPECT = 'Aspect of Practice',
  TASK = 'Task',
  RESTRICTED = 'Restricted Activity',
  CLINICAL = 'Clinical',
  SUPPORT = 'Clinical Support',
}

export enum TooltipIconTypes {
  GREEN_CHECKMARK = 'greenCheckmarkIcon',
  YELLOW_CAUTION = 'yellowCautionIcon',
  RED_X = 'redXIcon',
  BLUE_QUESTION = 'blueQuestionIcon',
}

export const tooltipIcons: { [key in TooltipIconTypes]: TooltipIconProps } = {
  greenCheckmarkIcon: {
    text: `Within scope of practice or role description`,
    meaning: 'All activities can be performed.',
    icon: faCheckCircle,
    style: 'green-icon',
  },
  yellowCautionIcon: {
    text: `Can be performed with standards, limits, and conditions by regulatory college or employer (e.g., additional education)`,
    meaning: '',
    icon: faExclamationCircle,
    style: 'yellow-icon',
  },
  redXIcon: {
    text: `Outside scope of practice or role description`,
    meaning: 'All activities cannot be performed.',
    icon: faTimesCircle,
    style: 'red-icon',
  },
  blueQuestionIcon: {
    text: `Can perform some care activities with organizational support or additional education`,
    meaning: 'Some activities have restrictions.',
    icon: faQuestionCircle,
    style: 'blue-icon',
  },
};
