import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

const setValue = async (input: HTMLElement, value: string) => {
  await act(async () => {
    fireEvent.change(input, { target: { value } });
  });
};
import { SessionNameRenameControl } from '../src/components/planning/SessionNameRenameControl';
import { API_ENDPOINT } from '../src/common/request-method';

const mockRenamePlanningSession = jest.fn();

jest.mock('../src/services/usePlanningSessionMutations', () => ({
  usePlanningSessionMutations: () => ({
    renamePlanningSession: mockRenamePlanningSession,
    discardPlanningSession: jest.fn(),
    isLoading: false,
  }),
}));

const VALID_NAME = 'A perfectly valid name';

const Harness = ({ onRenamed }: { onRenamed?: (name: string) => void }) => {
  return (
    <SessionNameRenameControl sessionId='session-1' name='First draft name' onRenamed={onRenamed} />
  );
};

describe('SessionNameRenameControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenamePlanningSession.mockResolvedValue({ ok: true });
  });

  it('renders the current plan title and a Rename button', () => {
    render(<Harness />);

    expect(screen.getByRole('heading', { name: 'First draft name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens the rename dialog with save and cancel controls', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    expect(screen.getByRole('dialog', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('First draft name');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('saves the rename on Enter', async () => {
    const onRenamed = jest.fn();
    render(<Harness onRenamed={onRenamed} />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Name');
    await setValue(input, VALID_NAME);
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockRenamePlanningSession).toHaveBeenCalledWith('session-1', VALID_NAME);
    });
    expect(onRenamed).toHaveBeenCalledWith(VALID_NAME);
  });

  it('saves the rename when Save is clicked', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Name');
    await setValue(input, VALID_NAME);
    await click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockRenamePlanningSession).toHaveBeenCalledWith('session-1', VALID_NAME);
    });
  });

  it('cancels on Escape without saving', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Name');
    await setValue(input, 'Something else entirely');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockRenamePlanningSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });

  it('cancels when Cancel is clicked', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));
    await click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockRenamePlanningSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });

  it('keeps the Rename dialog open with the text intact when the name is too short', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Name');
    await setValue(input, 'short');
    await click(screen.getByRole('button', { name: 'Save' }));

    expect(mockRenamePlanningSession).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('short');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('keeps the Rename dialog open and shows the message when the API rejects the name', async () => {
    mockRenamePlanningSession.mockResolvedValue({
      ok: false,
      error: 'A planning with this name already exists.',
    });
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByLabelText('Name');
    await setValue(input, VALID_NAME);
    await click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('A planning with this name already exists.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue(VALID_NAME);
  });

  it('does not call the API when the name is unchanged', async () => {
    render(<Harness />);

    await click(screen.getByRole('button', { name: 'Rename' }));
    await click(screen.getByRole('button', { name: 'Save' }));

    expect(mockRenamePlanningSession).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });

  it('encodes search and filter values when building planning-session queries', () => {
    const endpoint = API_ENDPOINT.findPlanningSessions({
      pageIndex: 1,
      pageSize: 10,
      searchText: 'ICU & Emergency',
      careSetting: 'A&B=C',
      bundleId: 'bundle/one',
    });

    expect(endpoint).toBe(
      '/sessions/find?pageSize=10&page=1&searchText=ICU+%26+Emergency&careSetting=A%26B%3DC&bundleId=bundle%2Fone',
    );
  });
});
