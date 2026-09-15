/**
 * Leaving a wizard stage saves the draft.
 *
 * A stage only wrote to the API when Next was pressed, so a planner who edited a stage
 * and then used the sidebar — to the care setting templates page, for example — lost the
 * edit. These cases pin the save that now happens on route change, and the two occasions
 * it must stay silent: nothing changed, and no draft exists yet.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Form, Formik, useFormikContext } from 'formik';

const routeHandlers: Record<string, ((url: string) => void)[]> = {};

const mockRouter = {
  events: {
    on: (event: string, handler: (url: string) => void) => {
      routeHandlers[event] = [...(routeHandlers[event] ?? []), handler];
    },
    off: (event: string, handler: (url: string) => void) => {
      routeHandlers[event] = (routeHandlers[event] ?? []).filter(h => h !== handler);
    },
  },
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const planningState = { isNextTriggered: false, sessionId: 'session-1' };
const mockBeginLeaveSave = jest.fn(() => jest.fn());
const mockUpdateProceedToNext = jest.fn();

jest.mock('../../src/services/usePlanningContext', () => ({
  usePlanningContext: () => ({
    state: planningState,
    updateWaitForValidation: jest.fn(),
    updateProceedToNext: mockUpdateProceedToNext,
    beginLeaveSave: mockBeginLeaveSave,
  }),
}));

import { usePlanningContent } from '../../src/services/usePlanningContent';

const navigateAway = () =>
  act(() => {
    (routeHandlers['routeChangeStart'] ?? []).forEach(handler => handler('/care-settings'));
  });

interface StageValues {
  occupation: string[];
}

const StageForm = () => {
  usePlanningContent();
  const { values, setFieldValue } = useFormikContext<StageValues>();

  return (
    <Form>
      <button type='button' onClick={() => setFieldValue('occupation', ['occupation-2'])}>
        Change selection
      </button>
      <span>{values.occupation.join(',')}</span>
    </Form>
  );
};

const renderStage = (onSubmit: jest.Mock) =>
  render(
    <Formik initialValues={{ occupation: ['occupation-1'] }} onSubmit={onSubmit}>
      <StageForm />
    </Formik>,
  );

describe('saving a draft when the planner leaves the page', () => {
  beforeEach(() => {
    Object.keys(routeHandlers).forEach(key => delete routeHandlers[key]);
    planningState.sessionId = 'session-1';
    mockBeginLeaveSave.mockClear();
  });

  it('saves the stage edits on navigation to another page', async () => {
    const onSubmit = jest.fn();
    renderStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });
    navigateAway();

    // Formik validates before submitting, so the call lands a microtask later.
    await act(async () => {});

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({ occupation: ['occupation-2'] });
    // The wizard must swallow the advance this save asks for; see PlanningContext.
    expect(mockBeginLeaveSave).toHaveBeenCalledTimes(1);
  });

  it('does not save when the planner only looked at the stage', async () => {
    const onSubmit = jest.fn();
    renderStage(onSubmit);

    navigateAway();
    await act(async () => {});

    expect(onSubmit).not.toHaveBeenCalled();
    expect(mockBeginLeaveSave).not.toHaveBeenCalled();
  });

  it('does not save the same edit twice when leaving again', async () => {
    const onSubmit = jest.fn();
    renderStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });
    navigateAway();
    await act(async () => {});
    navigateAway();
    await act(async () => {});

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('creates nothing when no draft exists yet', async () => {
    planningState.sessionId = '';
    const onSubmit = jest.fn();
    renderStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });
    navigateAway();
    await act(async () => {});

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stops listening once the stage is unmounted', async () => {
    const onSubmit = jest.fn();
    const { unmount } = renderStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });
    unmount();

    expect(routeHandlers['routeChangeStart'] ?? []).toHaveLength(0);
  });
});

/**
 * The Care Competencies stage keeps the competency the planner is reading in the form
 * values, and writes selections straight into the values object rather than through
 * Formik. Both break a naive comparison against the loaded values: the first makes
 * browsing look like an edit, the second makes a real edit look like nothing happened.
 */
describe('a stage that keeps view state in the form', () => {
  interface BundleValues {
    careActivityBundle: Record<string, string[]>;
    careActivityID: string;
  }

  const BundleStage = () => {
    usePlanningContent({ persistedFields: ['careActivityBundle'] });
    const { values, setFieldValue } = useFormikContext<BundleValues>();

    return (
      <Form>
        <button type='button' onClick={() => setFieldValue('careActivityID', 'bundle-1')}>
          Open a competency
        </button>
        <button
          type='button'
          onClick={() => {
            // As the stage does it: assigned onto the values object, not via Formik.
            values.careActivityBundle['bundle-1'] = ['activity-1', 'activity-2'];
          }}
        >
          Tick an activity
        </button>
      </Form>
    );
  };

  const renderBundleStage = (onSubmit: jest.Mock) =>
    render(
      <Formik
        initialValues={{ careActivityBundle: { 'bundle-1': ['activity-1'] }, careActivityID: '' }}
        onSubmit={onSubmit}
      >
        <BundleStage />
      </Formik>,
    );

  beforeEach(() => {
    Object.keys(routeHandlers).forEach(key => delete routeHandlers[key]);
    planningState.sessionId = 'session-1';
    mockBeginLeaveSave.mockClear();
  });

  it('does not save when the planner only opened a competency to read it', async () => {
    const onSubmit = jest.fn();
    renderBundleStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Open a competency' }));
    });
    navigateAway();
    await act(async () => {});

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves a selection written straight onto the values object', async () => {
    const onSubmit = jest.fn();
    renderBundleStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Tick an activity' }));
    });
    navigateAway();
    await act(async () => {});

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].careActivityBundle).toEqual({
      'bundle-1': ['activity-1', 'activity-2'],
    });
  });
});

/**
 * Next steps through the wizard; it is not itself an edit. Saving on every press made
 * walking back and forth announce "Changes saved automatically" over requests that wrote
 * nothing, so an untouched stage now advances silently — but only once it has been shown
 * to be valid, otherwise skipping the save would skip the stage's own rules with it.
 */
describe('pressing Next', () => {
  const renderNextStage = (onSubmit: jest.Mock, validate?: () => Record<string, string>) => {
    const ui = () => (
      <Formik
        initialValues={{ occupation: ['occupation-1'] }}
        onSubmit={onSubmit}
        validate={validate}
      >
        <StageForm />
      </Formik>
    );
    const { rerender } = render(ui());

    return {
      // A fresh element each time: re-rendering the identical one lets React bail out
      // before the stage ever sees that Next was pressed.
      pressNext: async () => {
        planningState.isNextTriggered = true;
        await act(async () => {
          rerender(ui());
        });
      },
    };
  };

  beforeEach(() => {
    Object.keys(routeHandlers).forEach(key => delete routeHandlers[key]);
    planningState.sessionId = 'session-1';
    planningState.isNextTriggered = false;
    mockBeginLeaveSave.mockClear();
    mockUpdateProceedToNext.mockClear();
  });

  it('moves on without saving a stage nobody changed', async () => {
    const onSubmit = jest.fn();
    const { pressNext } = renderNextStage(onSubmit);

    await pressNext();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(mockUpdateProceedToNext).toHaveBeenCalledTimes(1);
  });

  it('saves a stage the planner changed', async () => {
    const onSubmit = jest.fn();
    const { pressNext } = renderNextStage(onSubmit);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    });
    await pressNext();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({ occupation: ['occupation-2'] });
    // The advance is the save handler's to request once the write lands.
    expect(mockUpdateProceedToNext).not.toHaveBeenCalled();
  });

  it('refuses to move on when the draft left the stage invalid', async () => {
    const onSubmit = jest.fn();
    const { pressNext } = renderNextStage(onSubmit, () => ({ occupation: 'Required' }));

    await pressNext();

    expect(mockUpdateProceedToNext).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('always saves a stage that has no draft yet, since that save creates it', async () => {
    planningState.sessionId = '';
    const onSubmit = jest.fn();
    const { pressNext } = renderNextStage(onSubmit);

    await pressNext();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(mockUpdateProceedToNext).not.toHaveBeenCalled();
  });
});
