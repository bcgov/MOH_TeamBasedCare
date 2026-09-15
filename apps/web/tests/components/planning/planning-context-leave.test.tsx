/**
 * The wizard does not advance while the planner is leaving.
 *
 * Leaving a stage saves it through the same submit handler as Next, and that handler asks
 * the wizard to advance. On the way out that jump is wrong: it renders the next stage over
 * a page that is being replaced, and it sticks if the navigation is cancelled.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Form, Formik, useFormikContext } from 'formik';
import { useContext, useRef } from 'react';

const routeHandlers: Record<string, ((url: string) => void)[]> = {};

jest.mock('next/router', () => ({
  useRouter: () => ({
    events: {
      on: (event: string, handler: (url: string) => void) => {
        routeHandlers[event] = [...(routeHandlers[event] ?? []), handler];
      },
      off: (event: string, handler: (url: string) => void) => {
        routeHandlers[event] = (routeHandlers[event] ?? []).filter(h => h !== handler);
      },
    },
  }),
}));

import {
  PlanningContext,
  PlanningProvider,
} from '../../../src/components/planning/PlanningContext';
import { usePlanningContent } from '../../../src/services/usePlanningContent';
import { usePlanningContext } from '../../../src/services/usePlanningContext';

const emit = (event: string) =>
  act(() => {
    (routeHandlers[event] ?? []).forEach(handler => handler('/care-settings'));
  });

const Consumer = () => {
  const planning = useContext(PlanningContext);
  const finishSaves = useRef<(() => void)[]>([]);
  if (!planning) return null;

  return (
    <div>
      <span>step {planning.state.currentStep}</span>
      <button type='button' onClick={planning.updateProceedToNext}>
        Proceed
      </button>
      <button type='button' onClick={() => finishSaves.current.push(planning.beginLeaveSave())}>
        Leave save
      </button>
      <button type='button' onClick={() => finishSaves.current.shift()?.()}>
        Finish save
      </button>
    </div>
  );
};

const press = (name: string) =>
  act(() => {
    screen.getByRole('button', { name }).click();
  });

const proceed = () => press('Proceed');
const leaveSave = () => press('Leave save');

const renderWizard = () =>
  render(
    <PlanningProvider>
      <Consumer />
    </PlanningProvider>,
  );

describe('advancing the planning wizard', () => {
  beforeEach(() => {
    Object.keys(routeHandlers).forEach(key => delete routeHandlers[key]);
  });

  it('advances when a stage saves in place', () => {
    renderWizard();

    proceed();

    expect(screen.getByText('step 2')).toBeInTheDocument();
  });

  it('stays put when the save came from leaving the page', () => {
    renderWizard();

    leaveSave();
    proceed();

    expect(screen.getByText('step 1')).toBeInTheDocument();
  });

  it('advances again once the leave save has been accounted for', () => {
    renderWizard();

    leaveSave();
    proceed();
    press('Finish save');
    proceed();

    expect(screen.getByText('step 2')).toBeInTheDocument();
  });

  it('accounts for each leave save separately', () => {
    renderWizard();

    leaveSave();
    leaveSave();
    proceed();
    proceed();

    expect(screen.getByText('step 1')).toBeInTheDocument();

    press('Finish save');
    proceed();
    expect(screen.getByText('step 1')).toBeInTheDocument();
    press('Finish save');
    proceed();

    expect(screen.getByText('step 2')).toBeInTheDocument();
  });
});

/**
 * The save started on the way out is not awaited, so its result can land long after the
 * route change. A "leaving" flag cleared when the navigation is cancelled is already back
 * to false by then, and the wizard jumps a stage the planner never asked to leave.
 */
describe('a leave save whose result lands after a cancelled navigation', () => {
  interface StageValues {
    occupation: string[];
  }

  const Stage = () => {
    usePlanningContent();
    const { setFieldValue } = useFormikContext<StageValues>();
    const { state, updateSessionId, updateProceedToNext } = usePlanningContext();

    return (
      <Form>
        <span>step {state.currentStep}</span>
        <button type='button' onClick={() => updateSessionId('session-1')}>
          Open draft
        </button>
        <button type='button' onClick={() => setFieldValue('occupation', ['occupation-2'])}>
          Change selection
        </button>
        <button type='button' onClick={updateProceedToNext}>
          Save landed
        </button>
      </Form>
    );
  };

  const renderStage = (onSubmit: jest.Mock) =>
    render(
      <PlanningProvider>
        <Formik initialValues={{ occupation: ['occupation-1'] }} onSubmit={onSubmit}>
          <Stage />
        </Formik>
      </PlanningProvider>,
    );

  beforeEach(() => {
    Object.keys(routeHandlers).forEach(key => delete routeHandlers[key]);
  });

  it('does not advance the wizard', async () => {
    let finishSave: (saved: boolean) => void = () => {};
    const onSubmit = jest.fn(
      () =>
        new Promise<boolean>(resolve => {
          finishSave = resolve;
        }),
    );
    renderStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Open draft' }));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });

    // The planner heads for another page, so the stage is saved on the way out.
    emit('routeChangeStart');
    await act(async () => {});
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // The navigation is cancelled, putting the planner back on the stage.
    emit('routeChangeError');

    // Only now does the save come back and ask the wizard to move on.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Save landed' }));
    });

    expect(screen.getByText('step 1')).toBeInTheDocument();
    await act(async () => finishSave(true));
  });
});
