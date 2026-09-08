import { GlossaryEntry } from '@tbcm/common';
import { ReactNode } from 'react';
import { useGlossary } from 'src/services/useGlossary';
import { Tooltip } from '../generic/Tooltip';

interface GlossaryTermProps {
  /** Resolved entry; when omitted, `term` is looked up in the dictionary */
  entry?: GlossaryEntry;
  term?: string;
  children?: ReactNode;
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({ entry, term, children }) => {
  const { findEntry } = useGlossary();

  const resolvedEntry = entry ?? (term ? findEntry(term) : undefined);
  const label = children ?? term ?? resolvedEntry?.term;

  if (!resolvedEntry) return <>{label}</>;

  return (
    <Tooltip
      triggerClassName='inline cursor-help text-left text-bcBlueLink underline decoration-dotted underline-offset-2'
      content={
        <span className='block'>
          <span className='block font-bold'>{resolvedEntry.term}</span>
          <span className='block'>{resolvedEntry.definition}</span>
        </span>
      }
    >
      {label}
    </Tooltip>
  );
};
