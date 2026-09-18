import { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { UnitFilter } from 'src/components/care-settings/unit-filter';

const mockAxios = jest.fn();

jest.mock('src/utils/axios-config', () => ({
  AxiosPublic: (...args: unknown[]) => mockAxios(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
    {children}
  </SWRConfig>
);

const units = [
  { id: 'unit-medical', displayName: 'Medical Unit' },
  { id: 'unit-emergency', displayName: 'Emergency Department' },
];

describe('UnitFilter', () => {
  beforeEach(() => mockAxios.mockReset());

  it('loads independent unit options, sorts by label and emits the selected ID', async () => {
    mockAxios.mockResolvedValue({ data: units });
    const onChange = jest.fn();
    render(<UnitFilter value='' onChange={onChange} />, { wrapper });

    const button = screen.getByRole('button', { name: 'Unit: All units' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await screen.findByRole('option', { name: 'Emergency Department' });
    expect(mockAxios).toHaveBeenCalledWith('/carelocations');
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'All units',
      'Emergency Department',
      'Medical Unit',
    ]);
    expect(screen.getByRole('option', { name: 'All units' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.click(screen.getByRole('option', { name: 'Emergency Department' }));
    expect(onChange).toHaveBeenCalledWith('unit-emergency');
  });

  it('disables the select and announces loading until options arrive', async () => {
    let resolve!: (response: { data: typeof units }) => void;
    mockAxios.mockReturnValue(new Promise(done => (resolve = done)));
    render(<UnitFilter value='' onChange={jest.fn()} />, { wrapper });

    expect(screen.getByRole('button', { name: 'Unit: All units' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading units...');

    await act(async () => resolve({ data: units }));

    expect(screen.getByRole('button', { name: 'Unit: All units' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('surfaces loading failures and retries without submitting a surrounding form', async () => {
    mockAxios.mockRejectedValueOnce(new Error('Unavailable'));
    const onSubmit = jest.fn(e => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <UnitFilter value='' onChange={jest.fn()} />
      </form>,
      { wrapper },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load units.');
    expect(screen.getByRole('button', { name: 'Unit: All units' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    mockAxios.mockResolvedValueOnce({ data: units });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Unit: All units' })).toBeEnabled();
    expect(mockAxios).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps All units available when the unit catalogue is empty', async () => {
    mockAxios.mockResolvedValue({ data: [] });
    render(<UnitFilter value='' onChange={jest.fn()} />, { wrapper });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Unit: All units' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Unit: All units' }));
    await screen.findByRole('option', { name: 'All units' });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
