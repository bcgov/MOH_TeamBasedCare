import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { GlossaryText } from '../../../src/components/glossary';

jest.mock('@tbcm/common', () => ({
  GLOSSARY_DEFINITION_PENDING: 'TODO: definition pending content review',
  GLOSSARY_MATCH_INFLECTIONS: false,
  GLOSSARY_TERMS: [
    { term: 'Care Activity', definition: 'A discrete task.', aliases: ['Care Activities'] },
    { term: 'Assess', definition: 'TODO: definition pending content review' },
  ],
}));

describe('GlossaryText', () => {
  it('renders a trigger for each glossary term and plain text elsewhere', () => {
    render(<GlossaryText>Every care activity is a care activity.</GlossaryText>);

    expect(screen.getAllByRole('button', { name: 'care activity' })).toHaveLength(2);
    expect(screen.getByText(/Every/)).toBeInTheDocument();
  });

  it('reveals the definition on focus', async () => {
    render(<GlossaryText>A care activity.</GlossaryText>);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'care activity' }).focus());

    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
    expect(screen.getByText('A discrete task.')).toBeInTheDocument();
    expect(screen.getByText('Care Activity')).toBeInTheDocument();

    // the definition must be announced from the focused trigger itself
    expect(screen.getByRole('button', { name: /care activity/i })).toHaveAttribute(
      'aria-describedby',
      screen.getByRole('tooltip').id,
    );
  });

  it('renders text without triggers when nothing matches', () => {
    render(<GlossaryText>No description available.</GlossaryText>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('No description available.')).toBeInTheDocument();
  });

  it('never exposes terms whose definition is still pending', () => {
    render(<GlossaryText>Assess the patient.</GlossaryText>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Assess the patient.')).toBeInTheDocument();
  });
});
