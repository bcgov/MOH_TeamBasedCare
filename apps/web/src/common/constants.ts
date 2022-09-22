import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import {
  faClipboardList,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faExclamationCircle,
  faTimesCircle,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from './interfaces';

export const sidebarNavItems: SidebarButtonProps[] = [
  {
    id: '001',
    kind: SidebarButtonKind.REGULAR,
    text: 'Resourcing',
    active: true,
    faIcon: faUsers,
  },
  {
    id: '002',
    kind: SidebarButtonKind.COLLAPSIBLE,
    text: 'Planning',
    active: false,
    faIcon: faClipboardList,
    options: [
      {
        id: '003',
        text: 'Create New',
        active: false,
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
  'Care Activities Bundles',
  'Occupation',
  'Activities Gap',
  'Suggestions',
];

export enum TagStyles {
  BASE = 'occupation-tag',
  BLUE = 'occupation-tag-blue',
  GREEN = 'occupation-tag-green',
}

export enum TooltipIconTypes {
  GREEN_CHECKMARK = 'greenCheckmarkIcon',
  YELLOW_CAUTION = 'yellowCautionIcon',
  YELLOW_EXCLAMATION = 'yellowExclamationIcon',
  YELLOW_X = 'yellowXIcon',
  RED_X = 'redXIcon',
  GRAY_QUESTION = 'grayQuestionIcon',
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
  grayQuestionIcon: {
    text: `This occupation can perform some activities in this bundle with different restrictions. Please expand the care activities bundle on the left for more details.`,
    meaning: 'Some activities have restrictions.',
    icon: faQuestionCircle,
    style: 'gray-icon',
  },
};
