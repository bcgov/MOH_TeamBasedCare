import { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { CareTerminologiesCareSettingFilter } from 'src/components/care-terminologies/care-setting-filter';

const mockAxios = jest.fn();

jest.mock('src/utils/axios-config', () => ({
  AxiosPublic: (...args: unknown[]) => mockAxios(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
    {children}
  </SWRConfig>
);

const templates = [
  { id: 'tpl-medical', name: 'Medical Unit' },
  { id: 'tpl-emergency', name: 'Emergency Department' },
  { id: 'tpl-master', name: 'Acute Care - Master' },
];

const openFilter = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Care Setting: All care settings' }));

describe('CareTerminologiesCareSettingFilter', () => {
  beforeEach(() => mockAxios.mockReset());

  it('lists the care settings alphabetically and emits the selected template id', async () => {
    mockAxios.mockResolvedValue({ data: templates });
    const onChange = jest.fn();
    render(<CareTerminologiesCareSettingFilter value='' onChange={onChange} />, { wrapper });

    const button = screen.getByRole('button', { name: 'Care Setting: All care settings' });
    await waitFor(() => expect(button).toBeEnabled());
    openFilter();
    await screen.findByRole('option', { name: 'Emergency Department' });

    expect(mockAxios).toHaveBeenCalledWith('/care-settings/cms/templates-for-filter');
    // the master suffix is an implementation detail and is stripped for the planner
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'All care settings',
      'Acute Care',
      'Emergency Department',
      'Medical Unit',
    ]);

    fireEvent.click(screen.getByRole('option', { name: 'Emergency Department' }));
    expect(onChange).toHaveBeenCalledWith('tpl-emergency');
  });

  it('disables the filter and announces loading until the options arrive', async () => {
    let resolve!: (response: { data: typeof templates }) => void;
    mockAxios.mockReturnValue(new Promise(done => (resolve = done)));
    render(<CareTerminologiesCareSettingFilter value='' onChange={jest.fn()} />, { wrapper });

    expect(screen.getByRole('button', { name: 'Care Setting: All care settings' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading care settings...');

    await act(async () => resolve({ data: templates }));

    expect(screen.getByRole('button', { name: 'Care Setting: All care settings' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('surfaces loading failures and retries', async () => {
    mockAxios.mockRejectedValueOnce(new Error('Unavailable'));
    render(<CareTerminologiesCareSettingFilter value='' onChange={jest.fn()} />, { wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load care settings.');

    mockAxios.mockResolvedValueOnce({ data: templates });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Care Setting: All care settings' })).toBeEnabled();
  });
});
