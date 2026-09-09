/**
 * The template id used by the save hooks comes from the route, so it is
 * user-controlled input that ends up in a request path. These tests pin the
 * guard that keeps a crafted id from steering the request elsewhere.
 */
import { renderHook, act } from '@testing-library/react';
import { TemplateLevel } from '@tbcm/common';

const mockAxios = jest.fn();

jest.mock('../../src/utils/axios-config', () => ({
  AxiosPublic: (...args: unknown[]) => mockAxios(...args),
}));

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { useCareSettingTemplateUpdate } from '../../src/services/useCareSettingTemplateUpdate';
import { useUpdateTemplateDetails } from '../../src/services/useCareSettingTemplateDetailsUpdate';

const HOSTILE_IDS = [
  '../../../admin',
  'http://attacker.example.com',
  '//attacker.example.com',
  'abc?redirect=http://attacker.example.com',
  '',
];

const VALID_ID = '11111111-1111-1111-1111-111111111111';

describe('save hooks reject ids that are not plain template ids', () => {
  beforeEach(() => {
    mockAxios.mockReset();
    mockAxios.mockResolvedValue({ data: {} });
  });

  it.each(HOSTILE_IDS)('the full save sends nothing for %p', async id => {
    const { result } = renderHook(() => useCareSettingTemplateUpdate());

    let outcome: { status: string } | undefined;
    await act(async () => {
      outcome = await result.current.handleUpdateWithConflict(id, {} as never);
    });

    expect(outcome?.status).toBe('error');
    expect(mockAxios).not.toHaveBeenCalled();
  });

  it.each(HOSTILE_IDS)('the details save sends nothing for %p', async id => {
    const { result } = renderHook(() => useUpdateTemplateDetails());

    let outcome: { status: string } | undefined;
    await act(async () => {
      outcome = await result.current.handleUpdateDetails(id, {
        name: 'Anything',
        level: TemplateLevel.SITE,
        expectedVersion: 1,
      });
    });

    expect(outcome?.status).toBe('error');
    expect(mockAxios).not.toHaveBeenCalled();
  });

  it('still sends a request for a real template id', async () => {
    const { result } = renderHook(() => useUpdateTemplateDetails());

    await act(async () => {
      await result.current.handleUpdateDetails(VALID_ID, {
        name: 'Anything',
        level: TemplateLevel.SITE,
        expectedVersion: 1,
      });
    });

    expect(mockAxios).toHaveBeenCalledTimes(1);
  });
});
