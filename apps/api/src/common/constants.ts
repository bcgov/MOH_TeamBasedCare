export enum RESPONSE_STATUS {
  SUCCESS = 'success',
  ERROR = 'error',
}

export const SUCCESS_RESPONSE = {
  status: RESPONSE_STATUS.SUCCESS,
};

export enum CareActivityType {
  ASPECT_OF_PRACTICE = 'Aspect of Practice',
  TASK = 'Task',
  RESTRICTED_ACTIVITY = 'Restricted Activity',
}

export enum ClinicalType {
  CLINICAL = 'Clinical',
  SUPPORT = 'Clinical Support',
}

export enum ActivitiesActionType {
  GREEN_CHECK = 'Y',
  YELLOW = 'A',
  YELLOW_EXCLAMATION = 'C(E)',
  YELLOW_CAUTION = 'LC',
  RED = '',
  GREY = 'MIXED',
}
