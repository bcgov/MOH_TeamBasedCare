import { GLOSSARY_DEFINITION_PENDING, GlossaryEntry } from '@tbcm/common';
import { buildGlossaryIndex, matchGlossaryTerms } from '../../src/common/glossary-match';

const entries: GlossaryEntry[] = [
  { term: 'Care Activity', definition: 'A discrete task.', aliases: ['Care Activities'] },
  { term: 'Restricted Activity', definition: 'Needs authority.' },
  { term: 'Activity', definition: 'Any action.' },
  { term: 'C++', definition: 'A programming language.' },
];

const index = buildGlossaryIndex(entries);
const match = (text: string) => matchGlossaryTerms(text, index);

describe('matchGlossaryTerms', () => {
  it('wraps every occurrence of a term', () => {
    const segments = match('An activity, then another activity.');

    expect(segments.filter(s => s.entry).length).toBe(2);
    expect(segments.map(s => s.text).join('')).toBe('An activity, then another activity.');
  });

  it('matches case-insensitively and preserves the original casing', () => {
    const segments = match('care ACTIVITY here');
    const matched = segments.find(s => s.entry);

    expect(matched?.text).toBe('care ACTIVITY');
    expect(matched?.entry?.term).toBe('Care Activity');
  });

  it('prefers the longest match when terms overlap', () => {
    const segments = match('A restricted activity applies.');
    const matched = segments.find(s => s.entry);

    expect(matched?.text).toBe('restricted activity');
    expect(matched?.entry?.term).toBe('Restricted Activity');
  });

  it('resolves aliases to the canonical entry', () => {
    const matched = match('Several care activities exist.').find(s => s.entry);

    expect(matched?.text).toBe('care activities');
    expect(matched?.entry?.term).toBe('Care Activity');
  });

  it('does not match inside longer words', () => {
    expect(match('inactivity and activities')).toEqual([{ text: 'inactivity and activities' }]);
  });

  it('treats terms with regex metacharacters literally', () => {
    expect(match('Written in C++ mostly').find(s => s.entry)?.entry?.term).toBe('C++');
    expect(match('Written in Cxx mostly').find(s => s.entry)).toBeUndefined();
  });

  it('returns the text unchanged for an empty dictionary', () => {
    expect(matchGlossaryTerms('care activity', buildGlossaryIndex([]))).toEqual([
      { text: 'care activity' },
    ]);
  });

  it('returns no segments for empty text', () => {
    expect(match('')).toEqual([]);
  });

  it('is reusable across calls without leaking regex state', () => {
    expect(match('activity').length).toBe(1);
    expect(match('activity').length).toBe(1);
  });
});

describe('buildGlossaryIndex', () => {
  it('skips entries with no definition yet', () => {
    const index = buildGlossaryIndex([
      { term: 'Administer', definition: GLOSSARY_DEFINITION_PENDING },
      { term: 'Advocate', definition: '  ' },
      { term: 'Assess', definition: 'Collects data.' },
    ]);

    expect(matchGlossaryTerms('Administer and advocate and assess', index)).toEqual([
      { text: 'Administer and advocate and ' },
      { text: 'assess', entry: { term: 'Assess', definition: 'Collects data.' } },
    ]);
  });

  it('matches exact terms only by default', () => {
    const index = buildGlossaryIndex([{ term: 'Assess', definition: 'Collects data.' }]);

    expect(matchGlossaryTerms('Assessing the patient', index).some(s => s.entry)).toBe(false);
  });

  it('matches regular inflections when enabled', () => {
    const verbs = ['Assess', 'Apply', 'Change', 'Screen'].map(term => ({
      term,
      definition: `${term} definition.`,
    }));
    const index = buildGlossaryIndex(verbs, { matchInflections: true });

    const matched = (text: string) => matchGlossaryTerms(text, index).find(s => s.entry);

    expect(matched('Assessing the patient')?.entry?.term).toBe('Assess');
    expect(matched('Assesses the patient')?.entry?.term).toBe('Assess');
    expect(matched('Applied a dressing')?.entry?.term).toBe('Apply');
    expect(matched('Applying a dressing')?.entry?.term).toBe('Apply');
    expect(matched('Changed the dressing')?.entry?.term).toBe('Change');
    expect(matched('Screening for risk')?.entry?.term).toBe('Screen');
  });

  it('leaves multi-word terms uninflected', () => {
    const index = buildGlossaryIndex([{ term: 'Set up', definition: 'Prepares equipment.' }], {
      matchInflections: true,
    });

    expect(matchGlossaryTerms('Set up the room', index).find(s => s.entry)?.text).toBe('Set up');
    expect(matchGlossaryTerms('Set ups the room', index).find(s => s.entry)).toBeUndefined();
  });
});
