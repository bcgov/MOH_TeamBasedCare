import { Role } from '@tbcm/common';
import { CareActivityController } from './care-activity.controller';

describe('CareActivityController permissions', () => {
  it.each([
    'downloadCareActivities',
    'findCareActivitiesCMS',
    'getCareActivityCMSById',
    'updateCareActivityCMS',
    'removeCareActivityCMS',
    'removeCareActivity',
    'validateCareActivitiesCMS',
    'uploadCareActivitiesCMS',
  ] as const)('%s should be admin-only', method => {
    expect(Reflect.getMetadata('roles', CareActivityController.prototype[method])).toEqual([
      Role.ADMIN,
    ]);
  });
});
