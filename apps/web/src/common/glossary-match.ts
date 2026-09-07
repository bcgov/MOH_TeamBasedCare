import {
  GLOSSARY_DEFINITION_PENDING,
  GLOSSARY_MATCH_INFLECTIONS,
  GlossaryEntry,
} from '@tbcm/common';

export interface GlossarySegment {
  text: string;
  entry?: GlossaryEntry;
}

export interface GlossaryIndex {
  pattern?: RegExp;
  entriesByMatch: Map<string, GlossaryEntry>;
}

export interface GlossaryIndexOptions {
  matchInflections?: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * `\b` only asserts a boundary next to a word character, so it is applied per edge:
 * a term such as "C++" gets a boundary on its leading edge only. Lookbehind is
 * deliberately avoided for older Safari support.
 */
const toBoundedPattern = (term: string) => {
  const prefix = /^\w/.test(term) ? '\\b' : '';
  const suffix = /\w$/.test(term) ? '\\b' : '';

  return `${prefix}${escapeRegExp(term)}${suffix}`;
};

/**
 * Regular -s/-ed/-ing forms of a single-word term. Multi-word terms are left alone, and
 * irregular verbs ("take") need explicit aliases; the surplus forms this produces for them
 * are harmless because they never occur in real text.
 */
const getInflections = (term: string): string[] => {
  if (/\s/.test(term)) return [];

  if (/[^aeiou]y$/.test(term)) {
    const stem = term.slice(0, -1);
    return [`${stem}ies`, `${stem}ied`, `${term}ing`];
  }

  if (term.endsWith('e')) {
    return [`${term}s`, `${term}d`, `${term.slice(0, -1)}ing`];
  }

  if (/(s|x|z|ch|sh)$/.test(term)) {
    return [`${term}es`, `${term}ed`, `${term}ing`];
  }

  return [`${term}s`, `${term}ed`, `${term}ing`];
};

const hasDefinition = (entry: GlossaryEntry) =>
  !!entry.definition.trim() && entry.definition !== GLOSSARY_DEFINITION_PENDING;

export const buildGlossaryIndex = (
  entries: GlossaryEntry[],
  { matchInflections = GLOSSARY_MATCH_INFLECTIONS }: GlossaryIndexOptions = {},
): GlossaryIndex => {
  const entriesByMatch = new Map<string, GlossaryEntry>();

  entries.filter(hasDefinition).forEach(entry => {
    [entry.term, ...(entry.aliases ?? [])].forEach(match => {
      const key = match.trim().toLowerCase();
      if (!key) return;

      const keys = matchInflections ? [key, ...getInflections(key)] : [key];
      keys.forEach(k => {
        if (!entriesByMatch.has(k)) entriesByMatch.set(k, entry);
      });
    });
  });

  if (entriesByMatch.size === 0) return { entriesByMatch };

  // Longest first so overlapping terms resolve to the most specific match,
  // e.g. "Restricted Activity" wins over "Activity"
  const alternation = Array.from(entriesByMatch.keys())
    .sort((a, b) => b.length - a.length)
    .map(toBoundedPattern)
    .join('|');

  return { pattern: new RegExp(`(?:${alternation})`, 'gi'), entriesByMatch };
};

/** Splits text into plain and glossary-matched segments, preserving the original casing */
export const matchGlossaryTerms = (text: string, index: GlossaryIndex): GlossarySegment[] => {
  const { pattern, entriesByMatch } = index;

  if (!text) return [];
  if (!pattern) return [{ text }];

  const segments: GlossarySegment[] = [];
  let lastIndex = 0;

  pattern.lastIndex = 0;

  let match = pattern.exec(text);
  while (match !== null) {
    const entry = entriesByMatch.get(match[0].toLowerCase());

    if (entry) {
      if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) });
      segments.push({ text: match[0], entry });
      lastIndex = match.index + match[0].length;
    }

    match = pattern.exec(text);
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });

  return segments;
};
