import {
  getTemplatePermissionKey,
  normalizeRestrictionDescription,
  splitTemplatePermissionKey,
} from './template-permission';

describe('template permission helpers', () => {
  it('round-trips an activity-occupation key', () => {
    const key = getTemplatePermissionKey('activity-1', 'occupation-1');

    expect(key).toBe('activity-1::occupation-1');
    expect(splitTemplatePermissionKey(key)).toEqual(['activity-1', 'occupation-1']);
  });

  it('normalizes blank restriction descriptions to null', () => {
    expect(normalizeRestrictionDescription('  Restriction  ')).toBe('Restriction');
    expect(normalizeRestrictionDescription('   ')).toBeNull();
    expect(normalizeRestrictionDescription()).toBeNull();
  });
});
