import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

export enum REQUEST_METHOD {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

export const API_ENDPOINT = {
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_USER: '/auth/user',
  AUTH_REFRESH: '/auth/refresh',

  CARE_LOCATIONS: '/carelocations',
  CARE_ACTIVITIES: '/care-activity/bundle',
  SESSIONS: '/sessions',
  DRAFT_SESSION: '/sessions/draft',
  getPlanningProfile: (sessionId: string) => `/sessions/${sessionId}/profile`,
  OCCUPATIONS: '/occupations',
  getOccupationsById: (id: string) => `/occupations/${id}`,
  getPlanningCareActivityBundlesForSessionCareLocation: (sessionId: string) =>
    `/sessions/${sessionId}/care-activity/bundle`,
  getPlanningOccupation: (sessionId: string) => `/sessions/${sessionId}/occupation`,
  getPlanningCareActivity: (sessionId: string) => `/sessions/${sessionId}/care-activity`,
  getPlanningActivityGap: (sessionId: string) => `/sessions/${sessionId}/activities-gap`,
  getExportCsv: (sessionId: string) => `/sessions/${sessionId}/export-csv`,

  findOccupations: (
    pageIndex: number,
    pageSize: number,
    sortKey?: OccupationsFindSortKeys,
    sortOrder?: SortOrder,
    searchText?: string,
  ) => {
    let endpoint = `/occupations/find?pageSize=${pageSize}&page=${pageIndex}`;
    if (sortKey) endpoint += `&sortBy=${sortKey}`;
    if (sortOrder) endpoint += `&sortOrder=${sortOrder}`;
    if (searchText) endpoint += `&searchText=${searchText}`;
    return endpoint;
  },
};
