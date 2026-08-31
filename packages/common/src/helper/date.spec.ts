import { formatShortDateTime } from './date';

describe('formatShortDateTime', () => {
  it('formats an afternoon time as `Aug 28, 2026 5:39PM`', () => {
    expect(formatShortDateTime(new Date(2026, 7, 28, 17, 39))).toBe('Aug 28, 2026 5:39 PM');
  });

  it('formats a morning time without padding the hour', () => {
    expect(formatShortDateTime(new Date(2026, 0, 5, 9, 5))).toBe('Jan 05, 2026 9:05 AM');
  });

  it('returns undefined for an empty value', () => {
    expect(formatShortDateTime(undefined)).toBeUndefined();
  });
});
