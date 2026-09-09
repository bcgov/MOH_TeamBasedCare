/**
 * Save conflict dialog — UI case 22.
 *
 * Both buttons in this dialog destroy something: Reload discards the
 * administrator's work, Override discards someone else's. The wording has to
 * carry that, and Override has to be the primary action because the
 * administrator arrived here trying to save.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { SaveConflictModal } from 'src/components/care-settings/save-conflict-modal';

describe('SaveConflictModal', () => {
  const setup = (overrides = {}) => {
    const onReload = jest.fn();
    const onOverride = jest.fn();
    render(
      <SaveConflictModal
        isOpen
        setIsOpen={jest.fn()}
        onReload={onReload}
        onOverride={onOverride}
        {...overrides}
      />,
    );
    return { onReload, onOverride };
  };

  it('states plainly that nothing has been saved', () => {
    setup();

    expect(screen.getByText(/Nothing has been saved yet/)).toBeInTheDocument();
  });

  it('names who changed the template when the 409 supplied it', () => {
    setup({ authorDescription: 'Jane Doe saved changes to this template on 1 Jan 2026.' });

    expect(
      screen.getByText(/Jane Doe saved changes to this template on 1 Jan 2026\./),
    ).toBeInTheDocument();
  });

  it('reads sensibly when the 409 named nobody', () => {
    setup();

    expect(screen.getByText(/This template was changed since you opened it\./)).toBeInTheDocument();
  });

  it('renders Reload as the bordered secondary button and Override as the primary action', () => {
    setup();

    const reload = screen.getByRole('button', { name: 'Reload' });
    const override = screen.getByRole('button', { name: 'Override' });

    expect(reload.className).toContain('border-bcBluePrimary');
    expect(reload.className).toContain('bg-white');
    expect(override.className).toContain('bg-bcBluePrimary');
  });

  it('wires each button to its own action', () => {
    const { onReload, onOverride } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onOverride).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Override' }));
    expect(onOverride).toHaveBeenCalledTimes(1);
  });
});
