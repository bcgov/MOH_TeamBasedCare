/**
 * Dialog styling — UI case 15a.
 *
 * Every dialog in this feature dismisses through `ModalWrapper`'s `closeButton`
 * so it inherits the bordered `secondary` treatment. A dialog that rendered its
 * own plain text button would look like a link rather than a choice, so the
 * treatment is asserted rather than left to review.
 */
import { render, screen } from '@testing-library/react';
import { TemplateLevel } from '@tbcm/common';
import { EditDetailsModal } from 'src/components/care-settings/edit-details-modal';
import { LimitsConditionsModal } from 'src/components/care-settings/limits-conditions-modal';
import { SaveConflictModal } from 'src/components/care-settings/save-conflict-modal';

const expectBorderedSecondary = (name: string) => {
  const button = screen.getByRole('button', { name });
  expect(button.className).toContain('border-bcBluePrimary');
  expect(button.className).toContain('bg-white');
  expect(button.className).toContain('border-2');
};

describe('care settings dialog styling', () => {
  it('renders the Edit Details dialog with a bordered Cancel', () => {
    render(
      <EditDetailsModal
        isOpen
        setIsOpen={jest.fn()}
        currentName='Medical Unit'
        currentLevel={TemplateLevel.SITE}
        onConfirm={jest.fn()}
      />,
    );

    expectBorderedSecondary('Cancel');
  });

  it('renders the Limits and Conditions dialog with a bordered Cancel', () => {
    render(
      <LimitsConditionsModal
        isOpen
        setIsOpen={jest.fn()}
        limits={[]}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expectBorderedSecondary('Cancel');
  });

  it('renders the save conflict dialog with a bordered Reload', () => {
    render(
      <SaveConflictModal
        isOpen
        setIsOpen={jest.fn()}
        onReload={jest.fn()}
        onOverride={jest.fn()}
      />,
    );

    expectBorderedSecondary('Reload');
  });
});

describe('level dialogs', () => {
  it('disables Save until a first-save copy has both a name and a level', () => {
    render(
      <EditDetailsModal
        isOpen
        setIsOpen={jest.fn()}
        title='Care Setting Details'
        currentName=''
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    screen.getAllByRole('radio').forEach(radio => expect(radio).not.toBeChecked());
  });

  it('teaches the two levels in the details dialog', () => {
    render(
      <EditDetailsModal
        isOpen
        setIsOpen={jest.fn()}
        currentName='Medical Unit'
        currentLevel={TemplateLevel.SITE}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByRole('radio', { name: /Health Authority Template/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Site \/ Care Setting Template/ })).toBeChecked();
  });
});
