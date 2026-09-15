import { act, renderHook, waitFor } from '@testing-library/react';
import { CareSettingMasterPermissionsRO, Permissions } from '@tbcm/common';
import { useMasterPermissions } from 'src/services/useCareSettingMasterPermissions';

const mockAxios = jest.fn();

jest.mock('../../src/utils/axios-config', () => ({
  AxiosPublic: (...args: unknown[]) => mockAxios(...args),
}));

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

const deferredResponse = () => {
  let resolve!: (value: { data: CareSettingMasterPermissionsRO }) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<{ data: CareSettingMasterPermissionsRO }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('provincial master baseline status', () => {
  beforeEach(() => mockAxios.mockReset());

  it('waits for a template id without declaring the master missing', () => {
    const { result } = renderHook(() => useMasterPermissions());

    expect(result.current.status).toBe('loading');
    expect(result.current.masterPermissions).toEqual([]);
    expect(mockAxios).not.toHaveBeenCalled();
  });

  it.each([
    { masterId: null, status: 'missing' },
    { masterId: 'master-1', status: 'ready' },
  ])('distinguishes an empty $status baseline', async ({ masterId, status }) => {
    const response = deferredResponse();
    mockAxios.mockReturnValue(response.promise);
    const { result } = renderHook(() => useMasterPermissions('template-1'));

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    await act(async () => response.resolve({ data: { masterId, permissions: [] } }));

    expect(result.current.status).toBe(status);
    expect(result.current.masterPermissions).toEqual([]);
    expect(result.current.hasFailed).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('preserves the permission triples of an existing master', async () => {
    const permissions = [{ activityId: 'a1', occupationId: 'o1', permission: Permissions.LIMITS }];
    mockAxios.mockResolvedValue({ data: { masterId: 'master-1', permissions } });
    const { result } = renderHook(() => useMasterPermissions('template-1'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.masterPermissions).toEqual(permissions);
  });

  it('reports failure, clears it during retry, and accepts an empty master on recovery', async () => {
    mockAxios.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useMasterPermissions('template-1'));
    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(result.current.status).toBe('failed');
    expect(result.current.masterPermissions).toEqual([]);

    const response = deferredResponse();
    mockAxios.mockReturnValueOnce(response.promise);
    act(() => result.current.onRefresh());
    expect(result.current.status).toBe('loading');
    expect(result.current.hasFailed).toBe(false);

    await act(async () => response.resolve({ data: { masterId: 'master-1', permissions: [] } }));
    expect(result.current.status).toBe('ready');
  });

  it('does not treat an untyped legacy array as evidence of a missing master', async () => {
    mockAxios.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useMasterPermissions('template-1'));

    await waitFor(() => expect(result.current.status).toBe('failed'));
  });

  it('hides a previous baseline immediately when the template changes', async () => {
    mockAxios.mockResolvedValueOnce({
      data: {
        masterId: 'master-1',
        permissions: [{ activityId: 'a1', occupationId: 'o1', permission: Permissions.PERFORM }],
      },
    });
    const { result, rerender } = renderHook(({ id }) => useMasterPermissions(id), {
      initialProps: { id: 'template-1' },
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const response = deferredResponse();
    mockAxios.mockReturnValueOnce(response.promise);
    rerender({ id: 'template-2' });
    expect(result.current.status).toBe('loading');
    expect(result.current.masterPermissions).toEqual([]);

    await act(async () => response.resolve({ data: { masterId: null, permissions: [] } }));
    expect(result.current.status).toBe('missing');
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores a stale request that later calls %s',
    async outcome => {
      const oldResponse = deferredResponse();
      mockAxios.mockReturnValueOnce(oldResponse.promise);
      const { result, rerender } = renderHook(({ id }) => useMasterPermissions(id), {
        initialProps: { id: 'template-1' },
      });

      mockAxios.mockResolvedValueOnce({ data: { masterId: 'master-2', permissions: [] } });
      rerender({ id: 'template-2' });
      await waitFor(() => expect(result.current.status).toBe('ready'));

      await act(async () => {
        if (outcome === 'resolve') {
          oldResponse.resolve({ data: { masterId: null, permissions: [] } });
        } else {
          oldResponse.reject(new Error('old request failed'));
        }
      });
      expect(result.current.status).toBe('ready');
      expect(result.current.hasFailed).toBe(false);
    },
  );
});
