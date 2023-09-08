export enum REQUEST_METHOD {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

export const API_ENDPOINT = {
  CARE_LOCATIONS: '/carelocations',
  CARE_ACTIVITIES: '/care-activity/bundle',
  SESSIONS: '/sessions',
  getPlanningProfile: (sessionId: string) => `/sessions/${sessionId}/profile`,
  OCCUPATIONS: '/occupations',
  getPlanningCareActivityBundlesForSessionCareLocation: (sessionId: string) => `/sessions/${sessionId}/care-activity/bundle`,
  getPlanningOccupation: (sessionId: string) => `/sessions/${sessionId}/occupation`,
  getPlanningCareActivity: (sessionId: string) => `/sessions/${sessionId}/care-activity`,
  getPlanningActivityGap: (sessionId: string) => `/sessions/${sessionId}/activities-gap`,
  getExportCsv: (sessionId: string) => `/sessions/${sessionId}/export-csv`,
};
