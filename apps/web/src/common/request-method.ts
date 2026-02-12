import {
  CareActivitiesCMSFindSortKeys,
  CareActivitiesFindSortKeys,
  CareSettingsCMSFindSortKeys,
  OccupationalScopeOfPracticeSortKeys,
  OccupationsCMSFindSortKeys,
  OccupationsFindSortKeys,
  Permissions,
  SortOrder,
  UserManagementSortKeys,
} from '@tbcm/common';

export enum REQUEST_METHOD {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

// This method appends pagination, sorting, searching keys - as supplied
export interface EndpointQueryParams<T> {
  pageIndex?: number;
  pageSize?: number;
  sortKey?: T;
  sortOrder?: SortOrder;
  searchText?: string;
  careSetting?: string;
  filterByPermission?: Permissions;
}

const appendQueryParams = <T>(endpoint: string, listParams: EndpointQueryParams<T>) => {
  let parameterizedEndpoint = `${endpoint}?`;
  if (listParams.pageSize) parameterizedEndpoint += `&pageSize=${listParams.pageSize}`;
  if (listParams.pageIndex) parameterizedEndpoint += `&page=${listParams.pageIndex}`;
  if (listParams.sortKey) parameterizedEndpoint += `&sortBy=${listParams.sortKey}`;
  if (listParams.sortOrder) parameterizedEndpoint += `&sortOrder=${listParams.sortOrder}`;
  if (listParams.searchText) parameterizedEndpoint += `&searchText=${listParams.searchText}`;
  if (listParams.careSetting) parameterizedEndpoint += `&careSetting=${listParams.careSetting}`;
  if (listParams.filterByPermission)
    parameterizedEndpoint += `&filterByPermission=${listParams.filterByPermission}`;
  return parameterizedEndpoint;
};

export const API_ENDPOINT = {
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_USER: '/auth/user',
  AUTH_REFRESH: '/auth/refresh',

  BUNDLES: `/care-activity/bundles`,
  CARE_LOCATIONS: '/carelocations',
  CARE_ACTIVITY: `/care-activity`,
  CARE_ACTIVITIES: '/care-activity/by-bundles',
  CARE_ACTIVITY_COMMON_SEARCH_TERMS: 'care-activity/common-search-terms',
  SESSIONS: '/sessions',
  PLANNING_CARE_SETTING_TEMPLATES: '/sessions/care-setting-templates',
  LAST_DRAFT_SESSION: '/sessions/last_draft',
  getPlanningProfile: (sessionId: string) => `/sessions/${sessionId}/profile`,
  OCCUPATIONS: '/occupations',
  FEEDBACK: '/feedback',
  getOccupationsById: (id: string) => `/occupations/${id}`,
  getPlanningCareActivityBundlesForSessionCareLocation: (sessionId: string) =>
    `/sessions/${sessionId}/care-activity/bundle`,
  getPlanningOccupation: (sessionId: string) => `/sessions/${sessionId}/occupation`,
  getPlanningCareActivity: (sessionId: string) => `/sessions/${sessionId}/care-activity`,
  getPlanningActivityGap: (sessionId: string) => `/sessions/${sessionId}/activities-gap`,
  getSuggestions: (sessionId: string) => `/sessions/${sessionId}/suggestions`,
  getMinimumTeam: (sessionId: string) => `/sessions/${sessionId}/minimum-team`,
  getRedundantOccupations: (sessionId: string) => `/sessions/${sessionId}/redundant-occupations`,
  getActivitiesAllowedByOccupation: (
    occupationId: string,
    params: EndpointQueryParams<OccupationalScopeOfPracticeSortKeys>,
  ) => appendQueryParams(`/allowedActivities/occupation/${occupationId}`, params),
  findOccupations: (params: EndpointQueryParams<OccupationsFindSortKeys>) =>
    appendQueryParams('/occupations/find', params),
  findCareActivities: (params: EndpointQueryParams<CareActivitiesFindSortKeys>) =>
    appendQueryParams('/care-activity/find', params),
  findCareActivitiesCMS: (params: EndpointQueryParams<CareActivitiesCMSFindSortKeys>) =>
    appendQueryParams('/care-activity/cms/find', params),
  USER_GUIDE_FILES: '/user-guide',
  USER_GUIDE_SIGNED_URL: (name: string) => `/user-guide/${name}/signed-url`,
  findUsers: (params: EndpointQueryParams<UserManagementSortKeys>) =>
    appendQueryParams('/user/find', params),
  INVITE_USER: '/user/invite',
  EDIT_USER: (id: string) => `/user/${id}/edit`,
  REVOKE_USER: (id: string) => `/user/${id}/revoke`,
  RE_PROVISION_USER: (id: string) => `/user/${id}/re-provision`,
  CARE_ACTIVITY_CMS_BULK_VALIDATE: '/care-activity/cms/bulk/validate',
  CARE_ACTIVITY_CMS_BULK_UPLOAD: '/care-activity/cms/bulk/upload',
  CARE_ACTIVITY_DOWNLOAD: '/care-activity/cms/download',

  // Care Settings
  CMS_CARE_SETTING_TEMPLATES_FILTER: '/care-settings/cms/templates-for-filter',
  findCareSettings: (params: EndpointQueryParams<CareSettingsCMSFindSortKeys>) =>
    appendQueryParams('/care-settings/cms/find', params),
  getCareSettingTemplate: (id: string) => `/care-settings/${id}`,
  getCareSettingTemplateForCopy: (id: string) => `/care-settings/${id}/copy-data`,
  getCareSettingBundles: (id: string) => `/care-settings/${id}/bundles`,
  getCareSettingOccupations: (id: string) => `/care-settings/${id}/occupations`,
  copyCareSettingTemplate: (id: string) => `/care-settings/${id}/copy`,
  copyCareSettingTemplateFull: (sourceId: string) => `/care-settings/${sourceId}/copy-full`,
  updateCareSettingTemplate: (id: string) => `/care-settings/${id}`,
  deleteCareSettingTemplate: (id: string) => `/care-settings/${id}`,

  // Occupation CMS
  findOccupationsCMS: (params: EndpointQueryParams<OccupationsCMSFindSortKeys>) =>
    appendQueryParams('/occupations/cms/find', params),
  getOccupationCMS: (id: string) => `/occupations/cms/${id}`,
  createOccupation: '/occupations/cms',
  updateOccupationCMS: (id: string) => `/occupations/cms/${id}`,
  deleteOccupation: (id: string) => `/occupations/cms/${id}`,

  // KPI Dashboard
  KPI_OVERVIEW: '/kpi/overview',
  getKPIOverview: (params?: { healthAuthority?: string; careSettingId?: string }) => {
    let endpoint = '/kpi/overview';
    const queryParams: string[] = [];
    if (params?.healthAuthority)
      queryParams.push(`healthAuthority=${encodeURIComponent(params.healthAuthority)}`);
    if (params?.careSettingId) queryParams.push(`careSettingId=${params.careSettingId}`);
    if (queryParams.length > 0) endpoint += `?${queryParams.join('&')}`;
    return endpoint;
  },
  KPI_CARE_SETTINGS: '/kpi/care-settings',
};
