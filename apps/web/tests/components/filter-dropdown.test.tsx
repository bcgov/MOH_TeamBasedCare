import { fireEvent, render, screen } from '@testing-library/react';
import { TemplateLevelFilter } from '@tbcm/common';
import { DashboardFilters } from 'src/components/dashboard/DashboardFilters';
import { LevelFilter } from 'src/components/care-settings/level-filter';

describe('shared dashboard filter dropdown', () => {
  it('preserves dashboard selection and does not submit a surrounding form', async () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn(e => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <DashboardFilters
          filterType='healthAuthority'
          healthAuthorityOptions={[
            { value: '', label: 'All' },
            { value: 'Island Health', label: 'Island Health' },
          ]}
          selectedHealthAuthority=''
          onHealthAuthorityChange={onChange}
        />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Health Authority: All' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Island Health' }));

    expect(onChange).toHaveBeenCalledWith('Island Health');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('preserves the dashboard care-setting filter', async () => {
    const onChange = jest.fn();
    render(
      <DashboardFilters
        filterType='careSetting'
        careSettingOptions={[
          { value: '', label: 'All' },
          { value: 'unit-1', label: 'Medical Unit' },
        ]}
        selectedCareSetting='unit-1'
        onCareSettingChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Care Setting: Medical Unit' }));
    fireEvent.click(await screen.findByRole('option', { name: 'All' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uses the shared dropdown for template levels and follows the controlled value', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <LevelFilter value={TemplateLevelFilter.ALL} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Template level: All' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Provincial' }));
    expect(onChange).toHaveBeenCalledWith(TemplateLevelFilter.PROVINCIAL);

    rerender(<LevelFilter value={TemplateLevelFilter.PROVINCIAL} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Template level: Provincial' })).toBeVisible();
  });
});
