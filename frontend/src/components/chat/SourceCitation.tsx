import React from 'react';
import { SourceCitationData } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Props {
  citationId: number;
  sources?: SourceCitationData[];
}

export const SourceCitation: React.FC<Props> = ({ citationId, sources }) => {
  const { inspectSource } = useWorkspace();

  const matched = sources?.find((s) => s.id === citationId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matched) {
      inspectSource(matched);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title={
        matched
          ? matched.is_web
            ? `${matched.document_name} · Web Search`
            : `${matched.document_name} · Page ${matched.page}`
          : `Source [${citationId}]`
      }
      className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-mono font-medium rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer align-baseline"
    >
      [{citationId}]
    </button>
  );
};
