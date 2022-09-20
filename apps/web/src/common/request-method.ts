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
};
