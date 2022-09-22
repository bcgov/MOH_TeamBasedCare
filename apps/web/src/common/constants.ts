import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import { faClipboardList, faUsers } from '@fortawesome/free-solid-svg-icons';
import {
  faCheckCircle,
  faExclamationTriangle,
  faExclamationCircle,
  faTimesCircle,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

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

export const activityGapLegend = [
  {
    faIcon: faCheckCircle,
    color: '#2E8540',
    text: "Care activity can be performed as part of profession's scope of practice/ provider's role description",
  },
  {
    faIcon: faExclamationTriangle,
    color: '#FCBA19',
    text: 'Care activity can be performed with limits and conditions.',
  },
  {
    faIcon: faExclamationCircle,
    color: '#FCBA19',
    text: 'Care activity cannot be performed BUT occupation can assist with care activity.',
  },
  {
    faIcon: faTimesCircle,
    color: '#FCBA19',
    text: 'Care activity cannot be performed BUT occupation can assist with care activity.',
  },
  {
    faIcon: faTimesCircle,
    color: 'RED',
    text: "Care activity cannot be performed; not part of profession's scope of practice/ provider's role description.",
  },
  {
    faIcon: faQuestionCircle,
    color: '#606060',
    text: 'This occupation can perform some activities in this bundle with different restrictions. Please expand the activities bundle on the left for more details.',
  },
];
