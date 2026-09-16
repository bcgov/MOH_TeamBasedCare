import { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { ParentPermissionRO, Permissions } from '@tbcm/common';
import { useParentPermissions } from 'src/services/useCareSettingParentPermissions';

const mockAxios = jest.fn();

jest.mock('src/utils/axios-config', () => ({
  AxiosPublic: (...args: unknown[]) => mockAxios(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

const deferredResponse = () => {
  let resolve!: (value: { data: ParentPermissionRO[] }) => void;
  const promise = new Promise<{ data: ParentPermissionRO[] }>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('parent permissions availability', () => {
  beforeEach(() => mockAxios.mockReset());

  it('does not treat a pending request as an empty parent', async () => {
    const pending = deferredResponse();
    mockAxios.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useParentPermissions('template-1'), { wrapper });

    expect(result.current.parentPermissions).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    await act(async () => pending.resolve({ data: [] }));

    await waitFor(() => expect(result.current.parentPermissions).toEqual([]));
    expect(result.current.isLoading).toBe(false);
  });

  it('surfaces a failure and permits an explicit retry', async () => {
    mockAxios.mockRejectedValueOnce(new Error('Parent unavailable'));
    const { result } = renderHook(() => useParentPermissions('template-1'), { wrapper });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.parentPermissions).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    mockAxios.mockResolvedValueOnce({ data: [] });
    await act(async () => {
      await result.current.onRefresh();
    });

    await waitFor(() => expect(result.current.parentPermissions).toEqual([]));
    expect(result.current.error).toBeUndefined();
    expect(mockAxios).toHaveBeenCalledTimes(2);
  });

  it('does not reuse the previous template baseline or apply its late response', async () => {
    const first = deferredResponse();
    const second = deferredResponse();
    mockAxios.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ id }) => useParentPermissions(id), {
      initialProps: { id: 'template-1' },
      wrapper,
    });

    rerender({ id: 'template-2' });
    await act(async () =>
      first.resolve({
        data: [{ activityId: 'a', occupationId: 'o', permission: Permissions.PERFORM }],
      }),
    );
    expect(result.current.parentPermissions).toBeUndefined();
    await act(async () => second.resolve({ data: [] }));
    await waitFor(() => expect(result.current.parentPermissions).toEqual([]));
  });

  it('invalidates a previously loaded baseline when a refresh fails', async () => {
    mockAxios.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useParentPermissions('template-1'), { wrapper });
    await waitFor(() => expect(result.current.parentPermissions).toEqual([]));

    mockAxios.mockRejectedValueOnce(new Error('Parent unavailable'));
    await act(async () => {
      await result.current.onRefresh();
    });
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.parentPermissions).toBeUndefined();
  });

  it('does not request a baseline without a template id', () => {
    const { result } = renderHook(() => useParentPermissions(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.parentPermissions).toBeUndefined();
    expect(mockAxios).not.toHaveBeenCalled();
  });
});
