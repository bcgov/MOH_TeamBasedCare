import {
  CareActivitiesCMSFindSortKeys,
  CareActivitiesFindSortKeys,
  OccupationalScopeOfPracticeSortKeys,
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
};
