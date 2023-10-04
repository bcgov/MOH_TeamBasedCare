import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import {
  faClipboardList,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from './interfaces';

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
      },
      {
        id: '004',
        text: 'All Plan',
        active: false,
      },
    ],
  },
];

export const PlanningSteps = [
  'Profile',
  'Care Activity Bundles',
  'Occupations/Roles',
  'Gaps, Optimization and Suggestions',
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
  YELLOW_QUESTION = 'yellowQuestionIcon',
}

export const tooltipIcons: { [key in TooltipIconTypes]: TooltipIconProps } = {
  greenCheckmarkIcon: {
    text: `Within scope of practice or role description`,
    meaning: 'All activities can be performed.',
    icon: faCheckCircle,
    style: 'green-icon',
  },
  yellowCautionIcon: {
    text: `Can be performed with limits and conditions by employer or regulatory college, e.g., with additional education.`,
    meaning: '',
    icon: faExclamationTriangle,
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
