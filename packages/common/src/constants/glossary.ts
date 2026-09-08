export interface GlossaryEntry {
  /** Canonical label shown as the tooltip heading */
  term: string;
  definition: string;
  /** Plurals, acronyms and alternate spellings that resolve to the same definition */
  aliases?: string[];
}

/**
 * Definition placeholder for terms awaiting content. Entries carrying it are kept in the
 * list as a worklist but produce no hover trigger, so the marker never reaches users.
 */
export const GLOSSARY_DEFINITION_PENDING = 'TODO: definition pending content review';

/**
 * When true, terms also match their -s/-ed/-ing forms ("assessing" matches "Assess").
 */
export const GLOSSARY_MATCH_INFLECTIONS = false;

const pending = (term: string): GlossaryEntry => ({
  term,
  definition: GLOSSARY_DEFINITION_PENDING,
});

/**
 * Matching is case-insensitive, word-boundary based, and applies to every occurrence in a
 * block of text. Longer terms win over shorter overlapping ones. Irregular verbs need
 * explicit `aliases` even when inflection matching is enabled.
 */
export const GLOSSARY_TERMS: GlossaryEntry[] = [
  pending('Administer'),
  pending('Advocate'),
  {
    term: 'Apply',
    definition:
      "Physically using a topical substance (e.g., ointments, creams, or patches, wound dressing, cast) or therapeutic equipment on a patient's body (e.g., diagnostic or monitoring equipment).",
  },
  {
    term: 'Assess',
    definition:
      'Collection of subjective data (health history, symptoms) and objective data (vital signs, physical exams) to identify health needs.',
  },
  {
    term: 'Assist',
    definition:
      'Care activities that are not performed independently and require supervision by an appropriate RHP or direction from the patient.',
  },
  pending('Change'),
  pending('Collect'),
  pending('Communicate'),
  pending('Complete'),
  pending('Compound'),
  pending('Conduct'),
  pending('Confirm'),
  pending('Consult'),
  pending('Coordinate'),
  pending('Counsel'),
  pending('Delegate'),
  pending('Design'),
  pending('Diagnose'),
  pending('Dispense'),
  pending('Document'),
  pending('Educate'),
  pending('Empty'),
  pending('Encourage'),
  pending('Establish'),
  pending('Facilitate'),
  pending('Identify'),
  pending('Implement'),
  pending('Initiate'),
  pending('Insert'),
  pending('Manage'),
  pending('Measure'),
  pending('Monitor'),
  pending('Obtain'),
  pending('Order'),
  pending('Orientate'),
  pending('Perform'),
  pending('Prepare'),
  pending('Prescribe'),
  pending('Provide'),
  pending('Receive'),
  pending('Refer'),
  pending('Remove'),
  pending('Respond'),
  {
    term: 'Screen',
    definition:
      'Using tests/tools to determine the possible presence of a particular problem. Assessment may be required to further determine the nature of identified problems and to inform the interventions required/care plan.',
  },
  pending('Set up'),
  pending('Take'),
  pending('Transfer'),
];
