import { useMemo } from 'react';
import { useGlossary } from 'src/services/useGlossary';
import { GlossaryTerm } from './GlossaryTerm';

interface GlossaryTextProps {
  children: string;
}

/** Renders plain text with every glossary term wrapped in a hover definition */
export const GlossaryText: React.FC<GlossaryTextProps> = ({ children }) => {
  const { matchText } = useGlossary();

  const segments = useMemo(() => matchText(children), [children, matchText]);

  return (
    <>
      {segments.map(({ text, entry }, index) =>
        entry ? (
          <GlossaryTerm key={`glossary-term-${index}`} entry={entry}>
            {text}
          </GlossaryTerm>
        ) : (
          text
        ),
      )}
    </>
  );
};
