import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SessionsTable } from '../src/components/planning/SessionsTable';

const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

const mockUpdateSessionId = jest.fn();
const mockUpdateCurrentStep = jest.fn();
const mockUpdateSessionName = jest.fn();
const mockDiscardPlanningSession = jest.fn();
const mockRefreshSessions = jest.fn();
const mockClearSearch = jest.fn();
const mockOnSearchTextChange = jest.fn();

let mockFindState: any;

jest.mock('../src/services/usePlanningSessionsFind', () => ({
  usePlanningSessionsFind: () => mockFindState,
}));

const mockVerifyPlanningSession = jest.fn().mockResolvedValue({ ok: true });

jest.mock('../src/services/usePlanningSessionMutations', () => ({
  usePlanningSessionMutations: () => ({
    renamePlanningSession: jest.fn().mockResolvedValue({ ok: true }),
    discardPlanningSession: mockDiscardPlanningSession,
    verifyPlanningSession: mockVerifyPlanningSession,
    isLoading: false,
  }),
}));

jest.mock('../src/services/usePlanningContext', () => ({
  usePlanningContext: () => ({
    state: { sessionId: 'session-1', sessionName: 'Emergency draft one', currentStep: 1 },
    updateSessionId: mockUpdateSessionId,
    updateCurrentStep: mockUpdateCurrentStep,
    updateSessionName: mockUpdateSessionName,
  }),
}));

const sessions = [
  {
    id: 'session-1',
    name: 'Emergency draft one',
    careSetting: { id: 'cs-1', name: 'Emergency - SPH' },
    updatedAt: '2026-08-27T10:00:00.000Z',
    createdAt: '2026-08-20T09:00:00.000Z',
  },
  {
    id: 'session-2',
    name: 'Orphaned legacy draft',
    careSetting: null,
    updatedAt: '2026-08-26T10:00:00.000Z',
    createdAt: '2026-08-19T09:00:00.000Z',
  },
];

const buildFindState = (overrides: Partial<any> = {}) => ({
  sessions,
  pageIndex: 1,
  pageSize: 10,
  total: sessions.length,
  onPageOptionsChange: jest.fn(),
  sortKey: undefined,
  sortOrder: undefined,
  onSortChange: jest.fn(),
  searchText: '',
  onSearchTextChange: mockOnSearchTextChange,
  clearSearch: mockClearSearch,
  refreshSessions: mockRefreshSessions,
  isLoading: false,
  ...overrides,
});

describe('SessionsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDiscardPlanningSession.mockResolvedValue({ ok: true });
    mockFindState = buildFindState();
  });

  // FR-028: all four columns
  it('renders the four columns for every draft', () => {
    render(<SessionsTable />);

    expect(screen.getByRole('heading', { name: 'Draft Plans' })).toBeInTheDocument();
    expect(screen.getByText('Planning name')).toBeInTheDocument();
    expect(screen.getByText('Care Setting')).toBeInTheDocument();
    expect(screen.getByText('Latest Modified')).toBeInTheDocument();
    expect(screen.getByText('Created on')).toBeInTheDocument();

    expect(screen.getByText('Emergency draft one')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Emergency draft one' })).not.toBeInTheDocument();
    expect(screen.getByText('Emergency - SPH')).toBeInTheDocument();
  });

  // FR-049: legacy row with no care setting renders an em dash
  it('renders an em dash when a draft has no care setting', () => {
    render(<SessionsTable />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // FR-036: Continue loads the draft at the Care Competencies stage
  it('loads the draft at the Care Competencies stage on Continue', async () => {
    render(<SessionsTable />);

    await click(screen.getAllByRole('button', { name: /^Continue / })[1]);

    expect(mockUpdateSessionId).toHaveBeenCalledWith('session-2');
    expect(mockUpdateSessionName).toHaveBeenCalledWith('Orphaned legacy draft');
    expect(mockUpdateCurrentStep).toHaveBeenCalledWith(2);
  });

  // FR-037 / FR-039: discard always confirms first
  it('requires confirmation before discarding', async () => {
    render(<SessionsTable />);

    await click(screen.getAllByRole('button', { name: /^Discard / })[0]);

    expect(mockDiscardPlanningSession).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Delete Draft Care Plan?' })).toBeInTheDocument();
    expect(
      screen.getByText(/This draft will be permanently deleted and cannot be recovered/i),
    ).toBeInTheDocument();
  });

  it('does nothing when the discard confirmation is cancelled', async () => {
    render(<SessionsTable />);

    await click(screen.getAllByRole('button', { name: /^Discard / })[0]);
    await click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockDiscardPlanningSession).not.toHaveBeenCalled();
  });

  // US4 scenario 4: discarding the open draft returns the wizard to the Profile stage
  it('discards on confirmation and resets the wizard when the open draft is removed', async () => {
    render(<SessionsTable />);

    await click(screen.getAllByRole('button', { name: /^Discard / })[0]);

    const dialog = screen.getByRole('dialog');
    await click(within(dialog).getByRole('button', { name: 'Delete Draft' }));

    await waitFor(() => {
      expect(mockDiscardPlanningSession).toHaveBeenCalledWith('session-1');
    });
    expect(mockUpdateSessionId).toHaveBeenCalledWith();
    expect(mockUpdateCurrentStep).toHaveBeenCalledWith(1);
    expect(mockRefreshSessions).toHaveBeenCalled();
  });

  // FR-031: no drafts at all
  it('shows the empty state when the planner has no drafts', () => {
    mockFindState = buildFindState({ sessions: [], total: 0 });
    render(<SessionsTable />);

    expect(screen.getByText("You don't have any saved drafts yet.")).toBeInTheDocument();
  });

  // FR-044: a search that excludes everything is a distinct state, with a way back
  it('shows the no-results state with a way to clear the search', async () => {
    mockFindState = buildFindState({ sessions: [], total: 0, searchText: 'zzz' });
    render(<SessionsTable />);

    expect(screen.getByText('No drafts found matching your search.')).toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'Clear search' }));

    expect(mockClearSearch).toHaveBeenCalled();
  });

  // FR-040: a row left stale by another tab must fail recoverably, not load an empty stage
  it('shows a recoverable message and refreshes when Continue hits a removed draft', async () => {
    mockVerifyPlanningSession.mockResolvedValueOnce({
      ok: false,
      gone: true,
      error: 'This draft is no longer available. It may have already been discarded.',
    });

    render(<SessionsTable />);

    const [continueButton] = screen.getAllByRole('button', { name: /^Continue / });
    await click(continueButton);

    expect(
      screen.getByText('This draft is no longer available. It may have already been discarded.'),
    ).toBeInTheDocument();
    expect(mockRefreshSessions).toHaveBeenCalled();
    expect(mockUpdateCurrentStep).not.toHaveBeenCalled();
  });
});
