import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import { faClipboardList, faUsers } from '@fortawesome/free-solid-svg-icons';

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
  {
    id: '005',
    kind: SidebarButtonKind.REGULAR,
    text: 'Testing Spacing',
    active: false,
    faIcon: faUsers,
  },
];

export const PlanningSteps = [
  'Profile',
  'Care Activities Bundles',
  'Occupation',
  'Activities Gap',
  'Suggestions',
];

export const formFormatting =
  'w-full justify-right print:hidden border-2 bg-white rounded p-4 mt-4';
