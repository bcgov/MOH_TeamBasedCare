/**
 * Template details card — UI cases 5-7b.
 *
 * The card is the only place the wizard states what is being edited and where
 * it came from, so its title, source line, and level row are pinned here. The
 * edit wizard previously showed the template's *own* name on the "Edited from"
 * line; case 7 exists to stop that returning.
 */
import { render, screen } from '@testing-library/react';
import { TemplateLevel } from '@tbcm/common';
import { TemplateDetailsCard } from 'src/components/care-settings/template-details-card';

jest.mock('src/services/useMe', () => ({
  useMe: () => ({ me: { organization: 'HA1' }, hasUserRole: () => true }),
}));

describe('TemplateDetailsCard', () => {
  const baseProps = {
    templateName: 'Medical Unit — West',
    parentName: 'Medical Unit',
    stepDescription: 'Care Competencies and Corresponding Activities',
  };

  it('titles an unsaved copy after its parent (UI case 5)', () => {
    render(<TemplateDetailsCard {...baseProps} isSaved={false} />);

    expect(screen.getByRole('heading', { name: 'Medical Unit Copy' })).toBeInTheDocument();
  });

  it('titles a saved template with its own name and no suffix (UI case 6)', () => {
    render(<TemplateDetailsCard {...baseProps} isSaved level={TemplateLevel.HEALTH_AUTHORITY} />);

    expect(screen.getByRole('heading', { name: 'Medical Unit — West' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Copy$/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Template$/)).not.toBeInTheDocument();
  });

  it('shows the parent name — not its own — on the Edited from line (UI case 7)', () => {
    render(<TemplateDetailsCard {...baseProps} isSaved level={TemplateLevel.SITE} />);

    const line = screen.getByText(/Edited from:/).closest('p');
    expect(line).toHaveTextContent('Edited from: Medical Unit');
    expect(line).not.toHaveTextContent('Medical Unit — West');
  });

  it('omits the Edited from line when the template has no parent', () => {
    render(<TemplateDetailsCard {...baseProps} parentName={undefined} isSaved />);

    expect(screen.queryByText(/Edited from:/)).not.toBeInTheDocument();
  });

  it('hides the level row until the template is saved (UI case 7a)', () => {
    render(<TemplateDetailsCard {...baseProps} isSaved={false} />);

    expect(screen.queryByText(/Template level:/)).not.toBeInTheDocument();
  });

  it('shows the level row once saved (UI case 7b)', () => {
    render(<TemplateDetailsCard {...baseProps} isSaved level={TemplateLevel.SITE} />);

    expect(screen.getByText(/Template level:/).closest('p')).toHaveTextContent(
      'Template level: Site / Care Settings',
    );
  });

  it('renders the step description so the card works on every wizard step', () => {
    const { rerender } = render(
      <TemplateDetailsCard
        {...baseProps}
        isSaved
        stepDescription='Select the Care Competencies and Activities'
      />,
    );
    expect(screen.getByText('Select the Care Competencies and Activities')).toBeInTheDocument();

    rerender(
      <TemplateDetailsCard
        {...baseProps}
        isSaved
        stepDescription='Care Competencies and Corresponding Activities'
      />,
    );
    expect(screen.getByText('Care Competencies and Corresponding Activities')).toBeInTheDocument();
  });

  it('offers Edit Details only when the wizard supplies a handler', () => {
    const { rerender } = render(<TemplateDetailsCard {...baseProps} isSaved />);
    expect(screen.queryByRole('button', { name: 'Edit Details' })).not.toBeInTheDocument();

    rerender(<TemplateDetailsCard {...baseProps} isSaved onEditDetailsClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Edit Details' })).toBeInTheDocument();
  });
});
