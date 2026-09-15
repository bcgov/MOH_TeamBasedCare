import { act, renderHook } from '@testing-library/react';
import { SaveCareActivityDTO } from '@tbcm/common';

const mockSendApiRequest = jest.fn();
const mockFetchData = jest.fn();
const mockUpdateProceedToNext = jest.fn();

jest.mock('../../src/services/useHttp', () => ({
  useHttp: () => ({
    sendApiRequest: mockSendApiRequest,
    fetchData: mockFetchData,
  }),
}));

jest.mock('../../src/services/usePlanningContext', () => ({
  usePlanningContext: () => ({
    state: { sessionId: 'session-1', refetchActivityGap: false },
    updateProceedToNext: mockUpdateProceedToNext,
  }),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));

import { usePlanningCareActivities } from '../../src/services/usePlanningCareActivities';
import { usePlanningOccupations } from '../../src/services/usePlanningOccupations';
import { toast } from 'react-toastify';

const mockToastSuccess = toast.success as jest.Mock;

describe('planning draft save notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendApiRequest.mockImplementation((_config, onSuccess) => onSuccess());
  });

  it('shows a notification after care activities are saved', () => {
    const { result } = renderHook(() => usePlanningCareActivities());

    act(() => {
      result.current.handleSubmit({
        careActivities: [],
        careActivityBundle: {},
        careActivityID: '',
      } as SaveCareActivityDTO);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Changes saved automatically.');
  });

  it('shows a notification after occupations are saved', () => {
    const { result } = renderHook(() => usePlanningOccupations({ proceedToNextOnSubmit: true }));

    act(() => {
      result.current.handleSubmit({ occupation: ['occupation-1'] });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Changes saved automatically.');
  });

  it.each([true, false])(
    'waits for the care-activity request and returns its outcome (%s)',
    async saved => {
      let finish = () => {};
      mockSendApiRequest.mockImplementation(
        (_config, onSuccess) =>
          new Promise<void>(resolve => {
            finish = () => {
              if (saved) onSuccess();
              resolve();
            };
          }),
      );
      const { result } = renderHook(() => usePlanningCareActivities());
      let settled = false;
      const submission = result.current.handleSubmit({
        careActivityBundle: {},
      });
      submission.then(() => {
        settled = true;
      });
      await act(async () => {});
      expect(settled).toBe(false);
      await act(async () => finish());
      await expect(submission).resolves.toBe(saved);
    },
  );
});
