import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Formik, useFormikContext } from 'formik';
import cloneDeep from 'lodash/cloneDeep';
import { PlanningProvider } from 'src/components/planning/PlanningContext';
import { usePlanningContent } from 'src/services/usePlanningContent';
import { usePlanningContext } from 'src/services/usePlanningContext';
import { usePlanningOccupations } from 'src/services/usePlanningOccupations';

const handlers = new Map<string, Set<() => void>>();
const mockEvents = {
  on: (event: string, handler: () => void) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
  },
  off: (event: string, handler: () => void) => handlers.get(event)?.delete(handler),
};
jest.mock('next/router', () => ({ useRouter: () => ({ events: mockEvents }) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }));

const requests: { data: unknown; finish: (success: boolean) => void }[] = [];
const mockFetchData = jest.fn();
const mockSendApiRequest = jest.fn(
  (config: { data: unknown }, onSuccess: () => void) =>
    new Promise<void>(resolve => {
      requests.push({
        data: cloneDeep(config.data),
        finish: success => {
          if (success) onSuccess();
          resolve();
        },
      });
    }),
);
jest.mock('src/services/useHttp', () => ({
  useHttp: () => ({ sendApiRequest: mockSendApiRequest, fetchData: mockFetchData }),
}));

const Stage = () => {
  usePlanningContent();
  const { values, setFieldValue, isSubmitting } = useFormikContext<{ occupation: string[] }>();
  const { state, updateSessionId, updateNextTriggered } = usePlanningContext();
  return (
    <>
      <span>step {state.currentStep}</span>
      <span>{isSubmitting ? 'Saving' : 'Idle'}</span>
      <button onClick={() => updateSessionId('session-1')}>Open draft</button>
      <button onClick={() => setFieldValue('occupation', ['occupation-2'])}>Edit</button>
      <button onClick={() => setFieldValue('occupation', ['occupation-3'])}>Edit again</button>
      <button onClick={() => setFieldValue('occupation', ['occupation-1'])}>Undo edit</button>
      <button onClick={() => setFieldValue('occupation', [])}>Clear</button>
      <button onClick={updateNextTriggered}>Next</button>
      <span>{values.occupation.join(',')}</span>
    </>
  );
};

const Occupations = () => {
  const { handleSubmit } = usePlanningOccupations({ proceedToNextOnSubmit: true });
  return (
    <Formik
      initialValues={{ occupation: ['occupation-1'] }}
      onSubmit={handleSubmit}
      validate={values => (values.occupation.length ? {} : { occupation: 'Required' })}
    >
      <Stage />
    </Formik>
  );
};
const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
};
const emit = async (event: string) => {
  await act(async () => {
    handlers.get(event)?.forEach(handler => handler());
  });
};
const finish = async (success = true, index = requests.length - 1) => {
  await act(async () => requests[index].finish(success));
};

beforeEach(async () => {
  handlers.clear();
  requests.length = 0;
  jest.clearAllMocks();
  render(
    <PlanningProvider>
      <Occupations />
    </PlanningProvider>,
  );
  await click('Open draft');
});

it('saves later edits after a cancelled departure and lets Next advance', async () => {
  await click('Edit');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  await finish();
  expect(screen.getByText('Idle')).toBeInTheDocument();
  expect(screen.getByText('step 1')).toBeInTheDocument();

  await click('Edit again');
  await emit('routeChangeStart');
  expect(requests.map(request => request.data)).toEqual([
    { occupation: ['occupation-2'] },
    { occupation: ['occupation-3'] },
  ]);
  await emit('routeChangeError');
  await finish();
  await click('Next');
  expect(screen.getByText('step 2')).toBeInTheDocument();
  expect(requests).toHaveLength(2);
});

it('does not mark edits made during an outstanding request as saved', async () => {
  await click('Edit');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  await click('Edit again');
  await finish();
  await emit('routeChangeStart');
  expect(requests).toHaveLength(2);
  expect(requests[1].data).toEqual({ occupation: ['occupation-3'] });
  await finish();
});

it('releases a failed leave-save claim so Next retries and advances', async () => {
  await click('Edit');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  await finish(false);
  expect(screen.getByText('Idle')).toBeInTheDocument();
  await click('Next');
  expect(requests).toHaveLength(2);
  await finish();
  expect(screen.getByText('step 2')).toBeInTheDocument();
});

it('keeps Next usable after it is pressed while the cancelled departure is still saving', async () => {
  await click('Edit');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  await click('Next');
  expect(requests).toHaveLength(1);
  await finish();
  expect(screen.getByText('step 1')).toBeInTheDocument();
  await click('Next');
  expect(screen.getByText('step 2')).toBeInTheDocument();
});

it('releases the leave-save claim when validation prevents submission', async () => {
  await click('Clear');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  expect(requests).toHaveLength(0);
  expect(screen.getByText('Idle')).toBeInTheDocument();
  await click('Edit');
  await click('Next');
  await finish();
  expect(screen.getByText('step 2')).toBeInTheDocument();
});

it('deduplicates route events and waits for an outstanding save before saving newer edits', async () => {
  await click('Edit');
  await emit('routeChangeStart');
  await emit('routeChangeStart');
  expect(requests).toHaveLength(1);
  await emit('routeChangeError');
  await click('Edit again');
  await emit('routeChangeStart');
  expect(requests).toHaveLength(1);
  await finish();
  expect(requests).toHaveLength(2);
  expect(requests[1].data).toEqual({ occupation: ['occupation-3'] });
  await finish();
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

it('does not advance when a departure overlaps a Next save, even if the edit was undone', async () => {
  await click('Edit');
  await click('Next');
  await click('Undo edit');
  await emit('routeChangeStart');
  await emit('routeChangeError');
  await finish();
  expect(screen.getByText('step 1')).toBeInTheDocument();
  await click('Next');
  expect(requests).toHaveLength(2);
  expect(requests[1].data).toEqual({ occupation: ['occupation-1'] });
  await finish();
  expect(screen.getByText('step 2')).toBeInTheDocument();
});
