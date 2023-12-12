export enum RESPONSE_STATUS {
  SUCCESS = 'success',
  ERROR = 'error',
}

export const SUCCESS_RESPONSE = {
  status: RESPONSE_STATUS.SUCCESS,
};

export enum ActivitiesActionType {
  GREEN_CHECK = 'Y',
  YELLOW = 'A',
  YELLOW_EXCLAMATION = 'C(E)',
  YELLOW_CAUTION = 'LC',
  RED = '',
  GREY = 'MIXED',
}
