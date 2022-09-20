export enum REQUEST_METHOD {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

export const API_ENDPOINT = {
  CARE_LOCATIONS: '/carelocations',
  SESSIONS: '/sessions',
  getPlanningProfile: (sessionId: string) => `/sessions/${sessionId}/profile`,
  OCCUPATIONS: '/occupations',
  getPlanningOccupation: (sessionId: string) => `/sessions/${sessionId}/occupation`,
};
