import { GLOSSARY_TERMS, GlossaryEntry } from '@tbcm/common';
import { useCallback, useMemo } from 'react';
import { buildGlossaryIndex, GlossarySegment, matchGlossaryTerms } from 'src/common/glossary-match';

/**
 * Single access point for glossary content. Definitions are shipped as a static
 * constant today; swapping to an API-backed dictionary only requires changes here.
 */
export const useGlossary = () => {
  const entries = GLOSSARY_TERMS;

  const index = useMemo(() => buildGlossaryIndex(entries), [entries]);

  const matchText = useCallback(
    (text: string): GlossarySegment[] => matchGlossaryTerms(text, index),
    [index],
  );

  const findEntry = useCallback(
    (term: string): GlossaryEntry | undefined =>
      index.entriesByMatch.get(term.trim().toLowerCase()),
    [index],
  );

  return { entries, matchText, findEntry };
};
