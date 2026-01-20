import { Permissions } from './permissions';

export enum BULK_UPLOAD_COLUMNS {
  ID = 'ID',
  CARE_ACTIVITY = 'Care Activities',
  CARE_BUNDLE = 'Care Competencies',
  CARE_SETTING = 'Care Setting',
  ASPECT_OF_PRACTICE = 'Aspect of Practice',
}

export const BULK_UPLOAD_ALLOWED_PERMISSIONS = [Permissions.PERFORM, Permissions.LIMITS, 'N'];
