import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCareSettingTemplateDTO } from './care-setting-template.dto';

const ids = {
  activity: '11111111-1111-4111-8111-111111111111',
  occupation: '22222222-2222-4222-8222-222222222222',
  bundle: '33333333-3333-4333-8333-333333333333',
};

const changes = () => ({
  permissionUpserts: [
    {
      activityId: ids.activity,
      occupationId: ids.occupation,
      permission: 'Y',
    },
  ],
  permissionRemovals: [],
  selectedBundleIdsToAdd: [],
  selectedBundleIdsToRemove: [],
  selectedActivityIdsToAdd: [],
  selectedActivityIdsToRemove: [],
});

describe('UpdateCareSettingTemplateDTO', () => {
  it('accepts a complete delta payload', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, { changes: changes() });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a mixed full and delta payload', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, {
      changes: changes(),
      selectedBundleIds: [],
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects an overlapping permission upsert and removal', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, {
      changes: {
        ...changes(),
        permissionRemovals: [{ activityId: ids.activity, occupationId: ids.occupation }],
      },
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects an incomplete delta payload without throwing', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, {
      changes: {
        permissionUpserts: [],
        permissionRemovals: [],
        selectedBundleIdsToAdd: [],
        selectedBundleIdsToRemove: [],
        selectedActivityIdsToAdd: [],
      },
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects N as a delta permission upsert', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, {
      changes: {
        ...changes(),
        permissionUpserts: [
          {
            activityId: ids.activity,
            occupationId: ids.occupation,
            permission: 'N',
          },
        ],
      },
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts the existing complete-grid payload', async () => {
    const dto = plainToInstance(UpdateCareSettingTemplateDTO, {
      selectedBundleIds: [ids.bundle],
      selectedActivityIds: [ids.activity],
      permissions: [],
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
