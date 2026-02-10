import { SidebarButtonProps, SidebarButtonKind } from '../components/interface';
import {
  faCheckCircle,
  faTimesCircle,
  faQuestionCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
  DashboardIcon,
  PlanningIcon,
  OccupationalScopeIcon,
  CareSettingsIcon,
  UserManagementIcon,
  ContentManagementIcon,
} from '../components/icons';
import { TooltipIconProps } from './interfaces';
import { BULK_UPLOAD_COLUMNS, Role } from '@tbcm/common';

export enum AllowedPath {
  LANDING = '/',
  DASHBOARD = '/dashboard',
  PLANNING = '/planning',
  OCCUPATIONAL_SCOPE = '/occupational-scope',
  OCCUPATIONAL_SCOPE_ID = '/occupational-scope/:id',
  CARE_TERMINOLOGIES = '/care-terminologies',
  CARE_TERMINOLOGIES_ID = '/care-terminologies/:id',
  CARE_SETTINGS = '/care-settings',
  CARE_SETTINGS_EDIT = '/care-settings/:id/edit',
  USER_MANAGEMENT = '/user-management',
  CONTENT_MANAGEMENT = '/content-management',
  CONTENT_MANAGEMENT_CARE_ACTIVITY = '/content-management/care-activity/:id',
  CONTENT_MANAGEMENT_OCCUPATION = '/content-management/occupation/:id',
}

export const sidebarNavItems: SidebarButtonProps[] = [
  {
    id: '000',
    kind: SidebarButtonKind.REGULAR,
    text: 'Dashboard',
    active: false,
    icon: <DashboardIcon />,
    path: AllowedPath.DASHBOARD,
    roles: [Role.ADMIN, Role.CONTENT_ADMIN],
  },
  {
    id: '001',
    kind: SidebarButtonKind.REGULAR,
    text: 'Planning',
    active: false,
    icon: <PlanningIcon />,
    path: AllowedPath.PLANNING,
    roles: [Role.USER],
  },
  {
    id: '002',
    kind: SidebarButtonKind.REGULAR,
    text: 'Occupational scope',
    active: false,
    icon: <OccupationalScopeIcon />,
    path: AllowedPath.OCCUPATIONAL_SCOPE,
    hidden: false,
    roles: [Role.USER],
  },
  {
    id: '007',
    kind: SidebarButtonKind.REGULAR,
    text: 'Care Settings',
    active: false,
    icon: <CareSettingsIcon />,
    path: AllowedPath.CARE_SETTINGS,
    hidden: false,
    roles: [Role.ADMIN, Role.CONTENT_ADMIN],
  },
  {
    id: '003',
    kind: SidebarButtonKind.REGULAR,
    text: 'Modal of Care Terminologies',
    active: false,
    icon: <PlanningIcon />,
    path: AllowedPath.CARE_TERMINOLOGIES,
    hidden: true,
    roles: [Role.USER],
  },
  {
    id: '004',
    kind: SidebarButtonKind.LINE_BREAK,
    roles: [Role.ADMIN],
  },
  {
    id: '005',
    kind: SidebarButtonKind.REGULAR,
    text: 'User management',
    active: false,
    icon: <UserManagementIcon />,
    path: AllowedPath.USER_MANAGEMENT,
    hidden: false,
    roles: [Role.ADMIN],
  },
  {
    id: '006',
    kind: SidebarButtonKind.REGULAR,
    text: 'Content management',
    active: false,
    icon: <ContentManagementIcon />,
    path: AllowedPath.CONTENT_MANAGEMENT,
    hidden: false,
    roles: [Role.CONTENT_ADMIN],
  },
];

export const PlanningSteps = [
  'Profile',
  'Care Competencies',
  'Occupations/Roles',
  'Gaps, Optimizations and Suggestions',
];

export const CareSettingsSteps = ['Select template', 'Select Care Competencies', 'Finalize'];

export enum TagVariants {
  BASE = 'tag',
  GRAY = 'tag-gray',
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
    textWithOccupation: `Within scope of practice or role description for <OCCUPATION>`,
    meaning: 'All activities can be performed.',
    icon: faCheckCircle,
    style: 'green-icon',
  },
  yellowCautionIcon: {
    text: `Can be performed with standards, limits, and conditions by regulatory college or employer (e.g., additional education)`,
    textWithOccupation: `<OCCUPATION> can perform with standards, limits, and conditions by regulatory college or employer (e.g., additional education)`,
    meaning: '',
    icon: faExclamationCircle,
    style: 'yellow-icon',
  },
  redXIcon: {
    text: `Outside scope of practice or role description`,
    textWithOccupation: `Outside scope of practice or role description for <OCCUPATION>`,
    meaning: 'All activities cannot be performed.',
    icon: faTimesCircle,
    style: 'red-icon',
  },
  blueQuestionIcon: {
    text: `Can perform some care activities with organizational support or additional education`,
    textWithOccupation: `<OCCUPATION> can perform some care activities with organizational support or additional education`,
    meaning: 'Some activities have restrictions.',
    icon: faQuestionCircle,
    style: 'blue-icon',
  },
};

export const ActivityTagDefinitions: Partial<{ [key in ActivityTagVariants]: { text: string } }> = {
  [ActivityTagVariants.ASPECT]: {
    text: `Aspects of Practice are care activities, other than a restricted activity, which are part of providing a health service that is within the scope of practice of a designated health profession and requires professional knowledge, skills, ability, and judgement.`,
  },
  [ActivityTagVariants.RESTRICTED]: {
    text: `Restricted activities are a narrowly defined list of invasive, higher risk activities and are written in health profession specific regulations.`,
  },
  [ActivityTagVariants.TASK]: {
    text: `Tasks are lower risk care activities which are not a 'restricted activity' or an 'aspect of practice.'`,
  },
};

export const RoleTagVariant = {
  [Role.ADMIN]: TagVariants.BLUE,
  [Role.USER]: TagVariants.GREEN,
  [Role.CONTENT_ADMIN]: TagVariants.PURPLE,
};

export const UploadSheetColumns = [
  { header: BULK_UPLOAD_COLUMNS.ID, key: BULK_UPLOAD_COLUMNS.ID, width: 6 },
  { header: BULK_UPLOAD_COLUMNS.CARE_SETTING, key: BULK_UPLOAD_COLUMNS.CARE_SETTING, width: 13 },
  { header: BULK_UPLOAD_COLUMNS.CARE_BUNDLE, key: BULK_UPLOAD_COLUMNS.CARE_BUNDLE, width: 13 },
  { header: BULK_UPLOAD_COLUMNS.CARE_ACTIVITY, key: BULK_UPLOAD_COLUMNS.CARE_ACTIVITY, width: 50 },
  {
    header: BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE,
    key: BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE,
    width: 13,
  },
];

export const CareActivitySheetName = 'Care_Activities';
