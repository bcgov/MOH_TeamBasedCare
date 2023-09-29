import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import {
  faClipboardList,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faExclamationCircle,
  faTimesCircle,
  faQuestionCircle,
  faTools,
} from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from './interfaces';
import { UserRole } from '@tbcm/common';

export const sidebarNavItems: SidebarButtonProps[] = [
  {
    id: '001',
    kind: SidebarButtonKind.REGULAR,
    text: 'Resourcing',
    active: false,
    faIcon: faUsers,
  },
  {
    id: '002',
    kind: SidebarButtonKind.COLLAPSIBLE,
    text: 'Planning',
    active: true,
    faIcon: faClipboardList,
    options: [
      {
        id: '003',
        text: 'Create New',
        active: true,
        href: 'planning',
      },
      {
        id: '004',
        text: 'All Plan',
        active: false,
      },
    ],
  },
  {
    id: '005',
    kind: SidebarButtonKind.REGULAR,
    text: 'Admin',
    active: false,
    faIcon: faTools,
    href: 'admin',
    roles: [UserRole.ADMIN],
  },
];

export const PlanningSteps = ['Profile', 'Care Activities Bundles', 'Occupation', 'Activities Gap'];

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
  YELLOW_EXCLAMATION = 'yellowExclamationIcon',
  YELLOW_X = 'yellowXIcon',
  RED_X = 'redXIcon',
  YELLOW_QUESTION = 'yellowQuestionIcon',
}

export const tooltipIcons: { [key in TooltipIconTypes]: TooltipIconProps } = {
  greenCheckmarkIcon: {
    text: `Care activity can be performed as part of profession's scope of practice/provider's role description.`,
    meaning: 'All activities can be performed.',
    icon: faCheckCircle,
    style: 'green-icon',
  },
  yellowCautionIcon: {
    text: `Care activity can be performed with limits and conditions.`,
    meaning: '',
    icon: faExclamationTriangle,
    style: 'yellow-icon',
  },
  yellowExclamationIcon: {
    text: `Care activity could be performed with additional education/training.`,
    meaning: '',
    icon: faExclamationCircle,
    style: 'yellow-icon',
  },
  yellowXIcon: {
    text: `Care activity cannot be performed BUT occupation can assist with care activity.`,
    meaning: '',
    icon: faTimesCircle,
    style: 'yellow-icon',
  },
  redXIcon: {
    text: `Care activity cannot be performed; not part of profession's scope of practice/provider's role description.`,
    meaning: 'All activities cannot be performed.',
    icon: faTimesCircle,
    style: 'red-icon',
  },
  yellowQuestionIcon: {
    text: `This occupation can perform some activities in this bundle with different restrictions. Please expand the care activities bundle on the left for more details.`,
    meaning: 'Some activities have restrictions.',
    icon: faQuestionCircle,
    style: 'yellow-icon',
  },
};
