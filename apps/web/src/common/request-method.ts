import {
  CareActivitiesFindSortKeys,
  OccupationalScopeOfPracticeSortKeys,
  OccupationsFindSortKeys,
  Permissions,
  SortOrder,
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
  filterByPermission?: Permissions;
}

const appendQueryParams = <T>(endpoint: string, listParams: EndpointQueryParams<T>) => {
  let parameterizedEndpoint = `${endpoint}?`;
  if (listParams.pageSize) parameterizedEndpoint += `&pageSize=${listParams.pageSize}`;
  if (listParams.pageIndex) parameterizedEndpoint += `&page=${listParams.pageIndex}`;
  if (listParams.sortKey) parameterizedEndpoint += `&sortBy=${listParams.sortKey}`;
  if (listParams.sortOrder) parameterizedEndpoint += `&sortOrder=${listParams.sortOrder}`;
  if (listParams.searchText) parameterizedEndpoint += `&searchText=${listParams.searchText}`;
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

  CARE_LOCATIONS: '/carelocations',
  CARE_ACTIVITIES: '/care-activity/bundle',
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
};
