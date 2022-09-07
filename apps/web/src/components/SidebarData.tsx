import { SidebarButtonProps, ButtonKind } from './Interfaces';
import { faClipboardList, faUsers } from '@fortawesome/free-solid-svg-icons';

export const SidebarData: SidebarButtonProps[] = [
  {
    id: '001',
    kind: ButtonKind.REGULAR,
    text: 'Resourcing',
    active: true,
    faIcon: faUsers,
  },
  {
    id: '002',
    kind: ButtonKind.COLLAPSIBLE,
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
    kind: ButtonKind.REGULAR,
    text: 'Testing Spacing',
    active: false,
    faIcon: faUsers,
  },
];
