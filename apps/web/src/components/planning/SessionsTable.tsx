import { useEffect, useRef, useState } from 'react';
import {
  PlanningSessionSummaryRO,
  PlanningSessionsFindSortKeys,
  formatShortDateTime,
} from '@tbcm/common';
import { isOdd } from 'src/common/util';
import { Button } from '../Button';
import { ModalWrapper } from '../Modal';
import { PageOptions, Pagination } from '../Pagination';
import { SearchBar } from '../generic/SearchBar';
import { Spinner } from '../generic/Spinner';
import { SortButton } from '../SortButton';
import { usePlanningContext } from '../../services/usePlanningContext';
import { usePlanningSessionsFind } from '../../services/usePlanningSessionsFind';
import { usePlanningSessionMutations } from '../../services/usePlanningSessionMutations';

/** Wizard step the Continue action lands on (Care Competencies) */
const CARE_COMPETENCIES_STEP = 2;

/** Placeholder for a legacy row whose care setting template was deleted (FR-049) */
const NO_CARE_SETTING = '—';

const tdStyles = 'table-td px-6 py-4 text-left align-middle text-sm';

const headers: { label: string; name?: PlanningSessionsFindSortKeys }[] = [
  { label: 'Planning name', name: PlanningSessionsFindSortKeys.NAME },
  { label: 'Care Setting', name: PlanningSessionsFindSortKeys.CARE_SETTING_NAME },
  { label: 'Latest Modified', name: PlanningSessionsFindSortKeys.UPDATED_AT },
  { label: 'Created on', name: PlanningSessionsFindSortKeys.CREATED_AT },
  { label: '' },
];

export const SessionsTable = () => {
  const {
    sessions,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    searchText,
    onSearchTextChange,
    clearSearch,
    refreshSessions,
    isLoading,
  } = usePlanningSessionsFind();

  const {
    state: { sessionId, sessionsRefreshToken },
    updateSessionId,
    updateCurrentStep,
    updateSessionName,
  } = usePlanningContext();

  const { discardPlanningSession, verifyPlanningSession } = usePlanningSessionMutations();

  // A draft created or renamed outside this component (the first-save naming modal) makes
  // the listing stale, so re-fetch instead of showing a row that is missing or misnamed.
  const lastRefreshToken = useRef(sessionsRefreshToken);
  useEffect(() => {
    if (lastRefreshToken.current === sessionsRefreshToken) return;

    lastRefreshToken.current = sessionsRefreshToken;
    refreshSessions();
  }, [sessionsRefreshToken]);

  const [sessionToDiscard, setSessionToDiscard] = useState<PlanningSessionSummaryRO | null>(null);

  // Safety net for drafts removed in another tab: if the current page came back
  // empty while earlier pages still hold rows, the empty state hides the
  // pagination control, so fall back to the last page that has data.
  useEffect(() => {
    if (isLoading || sessions.length > 0 || total === 0 || pageIndex <= 1) return;

    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    if (pageIndex > lastPage) {
      onPageOptionsChange({ pageIndex: lastPage, pageSize, total });
    }
  }, [isLoading, sessions.length, total, pageIndex, pageSize]);

  const [isDiscarding, setIsDiscarding] = useState(false);
  const [goneMessage, setGoneMessage] = useState<string | null>(null);

  const onContinue = async (session: PlanningSessionSummaryRO) => {
    const result = await verifyPlanningSession(session.id);

    // The row may be stale if the draft was discarded elsewhere (FR-040)
    if (result.gone) {
      setGoneMessage(result.error ?? null);
      refreshSessions();
      return;
    }

    if (!result.ok) return;

    setGoneMessage(null);
    updateSessionId(session.id);
    updateSessionName(session.name);
    updateCurrentStep(CARE_COMPETENCIES_STEP);
  };

  const onConfirmDiscard = async () => {
    if (!sessionToDiscard) return;

    setIsDiscarding(true);
    const result = await discardPlanningSession(sessionToDiscard.id);
    setIsDiscarding(false);

    setGoneMessage(result.gone ? result.error ?? null : null);

    // Whether the draft was removed now or was already gone, the listing must be
    // refreshed so the row disappears (FR-040)
    if ((result.ok || result.gone) && sessionToDiscard.id === sessionId) {
      // The open draft was discarded — return the wizard to the Profile stage
      updateSessionId();
      updateSessionName('');
      updateCurrentStep(1);
    }

    setSessionToDiscard(null);

    // Removing the only row on a page past the first would leave an empty page
    // with no pagination control to escape from, so step back instead.
    if (sessions.length === 1 && pageIndex > 1) {
      onPageOptionsChange({ pageIndex: pageIndex - 1, pageSize, total });
      return;
    }

    refreshSessions();
  };

  const isSearching = Boolean(searchText);

  return (
    <div className='w-full flex flex-col gap-3 p-4 bg-white mt-4'>
      <h2 className='text-3xl font-bold text-gray-800'>Draft Plans</h2>
      {goneMessage && (
        <div
          role='alert'
          className='flex items-center justify-between gap-3 p-3 border border-bcYellowWarning bg-bcLightYellow text-sm'
        >
          <span>{goneMessage}</span>
          <Button variant='outline' type='button' onClick={() => setGoneMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <SearchBar
        placeholderText='Search by keyword'
        handleChange={event => onSearchTextChange({ text: event.target.value })}
        value={searchText}
        className='w-full'
      />

      {isLoading && <Spinner show />}

      {!isLoading && sessions.length === 0 && (
        <div className='py-6 text-center text-gray-600'>
          {isSearching ? (
            <>
              <p>No drafts found matching your search.</p>
              <Button variant='outline' type='button' classes='mt-2' onClick={clearSearch}>
                Clear search
              </Button>
            </>
          ) : (
            <p>You don&apos;t have any saved drafts yet.</p>
          )}
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <table className='table-auto w-full' aria-label='Your saved planning drafts'>
          <thead className='border-b table-row-fixed table-header'>
            <tr className='w-full'>
              {headers.map(({ label, name }, index) => (
                <th
                  key={`th${index}`}
                  scope='col'
                  className='table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-2 border-[#FCBA19]'
                >
                  <SortButton<PlanningSessionsFindSortKeys>
                    label={label}
                    name={name}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onChange={onSortChange}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sessions.map((session, index) => (
              <tr
                /* a table row treats `height` as a minimum, so this is a floor, not a cap */
                className={`h-[74px] ${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`}
                key={session.id}
              >
                <td className={tdStyles}>{session.name}</td>
                <td className={tdStyles}>{session.careSetting?.name || NO_CARE_SETTING}</td>
                <td className={tdStyles}>{formatShortDateTime(session.updatedAt)}</td>
                <td className={tdStyles}>{formatShortDateTime(session.createdAt)}</td>
                {/* the flex row lives inside the cell so the cell keeps table-cell alignment */}
                <td className={tdStyles}>
                  <div className='flex justify-end gap-6'>
                    <Button
                      variant='link'
                      classes='text-[15px]'
                      type='button'
                      aria-label={`Continue ${session.name}`}
                      onClick={() => onContinue(session)}
                    >
                      Continue
                    </Button>
                    <Button
                      variant='link'
                      /* red-700, not bcRedError: that fails AA contrast on the zebra rows */
                      classes='text-[15px] text-red-700 hover:text-red-900'
                      type='button'
                      aria-label={`Discard ${session.name}`}
                      onClick={() => setSessionToDiscard(session)}
                    >
                      Discard
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={100}>
                <Pagination
                  id='tbcm-planning-sessions-table'
                  pageOptions={{ pageIndex, pageSize, total }}
                  onChange={(options: PageOptions) => onPageOptionsChange(options)}
                />
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {sessionToDiscard && (
        <ModalWrapper
          isOpen={Boolean(sessionToDiscard)}
          setIsOpen={() => setSessionToDiscard(null)}
          containerClassName='sm:max-w-[652px] sm:w-full rounded-[4px] shadow-[4px_7px_25px_rgba(0,0,0,0.05)]'
          title='Delete Draft Care Plan?'
          titleClassName='text-xl md:text-2xl font-bold text-bcBluePrimary'
          descriptionClassName='p-0 text-gray-700'
          headerRight={
            <button
              type='button'
              aria-label='Close dialog'
              onClick={() => setSessionToDiscard(null)}
              disabled={isDiscarding}
              className='text-3xl leading-none text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:ring-offset-2 disabled:opacity-50'
            >
              ×
            </button>
          }
          description={
            <p className='py-2 text-sm md:text-base text-gray-600 leading-normal'>
              This draft will be permanently deleted and cannot be recovered. Any unsaved planning
              work associated with this draft will be lost.
            </p>
          }
          closeButton={{
            title: 'Cancel',
            variant: 'secondary',
            isDisabled: isDiscarding,
            onClick: () => setSessionToDiscard(null),
            classes: 'min-w-[112px]',
          }}
          actionButton={{
            title: 'Delete Draft',
            isLoading: isDiscarding,
            onClick: onConfirmDiscard,
            classes: 'min-w-[156px]',
          }}
        />
      )}
    </div>
  );
};
