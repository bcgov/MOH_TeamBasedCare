export const PLANNING_NAME_MIN_LENGTH = 10;
export const PLANNING_NAME_MAX_LENGTH = 100;

export const PLANNING_NAME_ERRORS = {
  REQUIRED: 'Planning name is required.',
  TOO_SHORT: `Planning name must be at least ${PLANNING_NAME_MIN_LENGTH} characters.`,
  TOO_LONG: `Planning name must be ${PLANNING_NAME_MAX_LENGTH} characters or fewer.`,
  DUPLICATE: 'A planning with this name already exists.',
};
