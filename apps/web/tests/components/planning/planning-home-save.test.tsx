import { act, fireEvent, render, screen } from '@testing-library/react';
import { Formik, useFormikContext } from 'formik';
import { PlanningProvider } from 'src/components/planning/PlanningContext';
import { usePlanningContent } from 'src/services/usePlanningContent';
import { usePlanningContext } from 'src/services/usePlanningContext';

const handlers = new Map<string, Set<(url: string) => void>>();
const mockEvents = {
  on: (event: string, handler: (url: string) => void) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
  },
  off: (event: string, handler: (url: string) => void) => handlers.get(event)?.delete(handler),
};
jest.mock('next/router', () => ({ useRouter: () => ({ events: mockEvents }) }));

let storedSelections: string[];
const requests: { finish: (success: boolean) => void }[] = [];

const Stage = () => {
  usePlanningContent();
  const { values, setFieldValue, errors, submitCount } = useFormikContext<{
    selections: string[];
  }>();
  return (
    <>
      <span>Selected: {values.selections.join(',')}</span>
      {submitCount > 0 && errors.selections && <span>{errors.selections}</span>}
      <button onClick={() => setFieldValue('selections', [...values.selections, 'A'])}>
        Select A
      </button>
      <button onClick={() => setFieldValue('selections', [...values.selections, 'B'])}>
        Select B
      </button>
      <button onClick={() => setFieldValue('selections', [])}>Clear</button>
    </>
  );
};

const Wizard = () => {
  const { state, updateCurrentStep, updateSessionId, updateProceedToNext } = usePlanningContext();
  return (
    <>
      <span>step {state.currentStep}</span>
      <span>refresh {state.sessionsRefreshToken}</span>
      {state.currentStep === 1 ? (
        <button
          onClick={() => {
            updateSessionId('draft-1');
            updateCurrentStep(2);
          }}
        >
          Continue
        </button>
      ) : (
        <Formik
          initialValues={{ selections: storedSelections }}
          validate={values => (values.selections.length ? {} : { selections: 'Required' })}
          onSubmit={values =>
            new Promise<boolean>(resolve => {
              requests.push({
                finish: success => {
                  if (success) {
                    storedSelections = [...values.selections];
                    updateProceedToNext();
                  }
                  resolve(success);
                },
              });
            })
          }
        >
          <Stage />
        </Formik>
      )}
    </>
  );
};

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
};
const emit = async (event: string, url = '/planning') => {
  await act(async () => {
    handlers.get(event)?.forEach(handler => handler(url));
  });
};
const finish = async (success = true) => {
  await act(async () => requests[requests.length - 1].finish(success));
};
const goHome = async () => {
  await emit('routeChangeStart');
  await emit('routeChangeComplete');
};

beforeEach(async () => {
  handlers.clear();
  requests.length = 0;
  storedSelections = ['original'];
  render(
    <PlanningProvider>
      <Wizard />
    </PlanningProvider>,
  );
  await click('Continue');
});

it('keeps the editor mounted until persistence completes, then reopens the saved selections', async () => {
  await click('Select A');
  await goHome();
  expect(requests).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  expect(screen.getByText('Selected: original,A')).toBeInTheDocument();

  await finish();
  expect(screen.getByText('step 1')).toBeInTheDocument();
  await click('Continue');
  expect(screen.getByText('Selected: original,A')).toBeInTheDocument();
  await click('Select B');
  await goHome();
  await finish();
  expect(storedSelections).toEqual(['original', 'A', 'B']);
});

it('waits for route completion when persistence finishes first', async () => {
  await click('Select A');
  await emit('routeChangeStart');
  await finish();
  expect(screen.getByText('step 2')).toBeInTheDocument();
  await emit('routeChangeComplete', '/planning/?from=sidebar');
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

it.each(['before', 'after'])(
  'preserves edits if saving fails %s route completion',
  async timing => {
    await click('Select A');
    await emit('routeChangeStart');
    if (timing === 'after') await emit('routeChangeComplete');
    await finish(false);
    if (timing === 'before') await emit('routeChangeComplete');
    expect(screen.getByText('Selected: original,A')).toBeInTheDocument();

    await goHome();
    expect(requests).toHaveLength(2);
    await finish();
    expect(screen.getByText('step 1')).toBeInTheDocument();
    expect(storedSelections).toEqual(['original', 'A']);
  },
);

it('keeps validation errors and unsaved values available for correction', async () => {
  await click('Clear');
  await goHome();
  expect(requests).toHaveLength(0);
  expect(screen.getByText('Required')).toBeInTheDocument();
  expect(screen.getByText('step 2')).toBeInTheDocument();
  await click('Select A');
  await goHome();
  await finish();
  expect(storedSelections).toEqual(['A']);
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

it('does not discard edits made while saving', async () => {
  await click('Select A');
  await goHome();
  await click('Select B');
  await finish();
  expect(screen.getByText('Selected: original,A,B')).toBeInTheDocument();
  expect(screen.getByText('step 2')).toBeInTheDocument();
  await goHome();
  await finish();
  expect(storedSelections).toEqual(['original', 'A', 'B']);
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

it('waits for newer edits when returning home overlaps a cancelled departure', async () => {
  await click('Select A');
  await emit('routeChangeStart', '/care-settings');
  await emit('routeChangeError', '/care-settings');
  await click('Select B');
  await goHome();
  expect(requests).toHaveLength(1);
  await finish();
  expect(requests).toHaveLength(2);
  expect(screen.getByText('step 2')).toBeInTheDocument();
  await finish();
  expect(storedSelections).toEqual(['original', 'A', 'B']);
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

it.each(['routeChangeStart', 'routeChangeError'])(
  'does not return home after a pending home transition is superseded by %s',
  async event => {
    await click('Select A');
    await goHome();
    await emit(event, '/care-settings');
    await finish();
    expect(screen.getByText('step 2')).toBeInTheDocument();
  },
);

it('returns home immediately without saving an unchanged draft', async () => {
  await goHome();
  expect(requests).toHaveLength(0);
  expect(screen.getByText('step 1')).toBeInTheDocument();
});

/**
 * `sessionsRefreshToken` is the context's "the listing is behind" signal. Today the home
 * remounts the drafts table and refetches regardless, so these assert the state contract
 * rather than a visible effect: the bump must not race ahead of the write it describes.
 */
describe('marking the drafts listing stale', () => {
  it('waits for the leaving save to land', async () => {
    await click('Select A');
    await goHome();
    expect(screen.getByText('refresh 0')).toBeInTheDocument();

    await finish();
    expect(screen.getByText('refresh 1')).toBeInTheDocument();
  });

  it('stays put when no stage was left', async () => {
    await goHome();
    expect(screen.getByText('refresh 1')).toBeInTheDocument();

    await goHome();
    expect(screen.getByText('refresh 1')).toBeInTheDocument();
  });
});
