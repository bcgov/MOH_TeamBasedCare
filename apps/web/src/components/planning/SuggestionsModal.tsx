import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCheck,
  faSpinner,
  faInfoCircle,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { CareActivityType, OccupationSuggestionRO, SuggestionResponseRO } from '@tbcm/common';
import { SimulatedCoverageBadge } from './SimulatedCoverageBadge';
import { SuggestionAlerts } from './SuggestionAlerts';
import { usePlanningContext } from '../../services/usePlanningContext';
import { useSuggestions } from '../../services/useSuggestions';
import { Pagination, PageOptions } from '../Pagination';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: (selectedIds: string[]) => void;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ isOpen, onClose }) => {
  const {
    state: { sessionId },
  } = usePlanningContext();
  const { getSuggestions, isLoading } = useSuggestions();

  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
  const [tempSelectedData, setTempSelectedData] = useState<Map<string, OccupationSuggestionRO>>(
    new Map(),
  );
  const [suggestions, setSuggestions] = useState<SuggestionResponseRO | null>(null);
  const [pageOptions, setPageOptions] = useState<PageOptions>({
    pageIndex: 1,
    pageSize: 10,
    total: 0,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(new Set());
      setTempSelectedData(new Map());
      setSuggestions(null);
      setPageOptions({ pageIndex: 1, pageSize: 10, total: 0 });
      setExpandedRows(new Set());
    }
  }, [isOpen]);

  const requestIdRef = useRef(0);

  const fetchSuggestions = useCallback(() => {
    if (!sessionId) return;

    const currentRequestId = ++requestIdRef.current;

    getSuggestions(
      {
        sessionId,
        tempSelectedIds: Array.from(tempSelected),
        page: pageOptions.pageIndex,
        pageSize: pageOptions.pageSize,
      },
      (data: SuggestionResponseRO) => {
        if (currentRequestId !== requestIdRef.current) return;
        setSuggestions(data);
        setPageOptions(prev => ({ ...prev, total: data.total }));
      },
    );
  }, [sessionId, getSuggestions, tempSelected, pageOptions.pageIndex, pageOptions.pageSize]);

  // Fetch suggestions when dependencies change (but not on initial mount handled by reset effect)
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSuggestions();
    }
  }, [isOpen, sessionId, fetchSuggestions]);

  const handleAddToTeam = (occupation: OccupationSuggestionRO) => {
    const newSelected = new Set(tempSelected);
    const newSelectedData = new Map(tempSelectedData);

    if (newSelected.has(occupation.occupationId)) {
      newSelected.delete(occupation.occupationId);
      newSelectedData.delete(occupation.occupationId);
    } else {
      newSelected.add(occupation.occupationId);
      newSelectedData.set(occupation.occupationId, occupation);
    }

    setTempSelected(newSelected);
    setTempSelectedData(newSelectedData);
    setPageOptions(prev => ({ ...prev, pageIndex: 1 }));
  };

  const handlePageChange = (newOptions: PageOptions) => {
    setPageOptions(newOptions);
  };

  const handleClose = () => {
    onClose(Array.from(tempSelected));
  };

  const mergedSuggestions = React.useMemo(() => {
    if (!suggestions) return [];

    const apiSuggestions = suggestions.suggestions.filter(s => !tempSelected.has(s.occupationId));
    const selectedOccupations = Array.from(tempSelectedData.values());

    return [...selectedOccupations, ...apiSuggestions];
  }, [suggestions, tempSelected, tempSelectedData]);

  const toggleRowExpansion = (rowKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  };

  // Render activities with truncation and expand/collapse
  // Colors depend on selection state:
  // - Not selected: both columns gray (#313132)
  // - Selected: Y column blue (#013366), L&C column yellow/gold (#664b07)
  const renderActivities = (
    activities: { activityId: string; activityName: string; activityType: CareActivityType }[],
    isLCColumn: boolean = false,
    isSelected: boolean = false,
    rowKey?: string,
  ) => {
    if (activities.length === 0) return <span className='text-gray-400'>-</span>;

    const TRUNCATE_COUNT = 3;
    const isExpanded = rowKey ? expandedRows.has(rowKey) : true;
    const displayActivities = isExpanded ? activities : activities.slice(0, TRUNCATE_COUNT);
    const hiddenCount = activities.length - TRUNCATE_COUNT;

    let colorClass = 'text-[#313132]'; // default gray for not selected
    if (isSelected) {
      colorClass = isLCColumn ? 'text-[#664b07]' : 'text-[#013366]';
    }

    const text = displayActivities.map(a => a.activityName).join(', ');

    return (
      <div className='flex flex-col'>
        <span className={`text-sm leading-6 ${colorClass}`}>{text}</span>
        {rowKey && hiddenCount > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              toggleRowExpansion(rowKey);
            }}
            className='text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1'
          >
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className='h-2.5 w-2.5'
            />
            {isExpanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    );
  };

  // Render the action button for an occupation
  const renderActionButton = (occupation: OccupationSuggestionRO, isSelected: boolean) => (
    <button
      onClick={() => handleAddToTeam(occupation)}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 px-4 py-1.5 text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
        isSelected
          ? 'bg-[#003366] text-white'
          : 'bg-white border border-[#606060] text-[#606060] hover:bg-gray-50'
      }`}
    >
      {isSelected ? 'Added' : 'Add to team'}
      <FontAwesomeIcon icon={isSelected ? faCheck : faPlus} className='h-4 w-4' />
    </button>
  );

  const renderContent = () => {
    if (isLoading && !suggestions) {
      return (
        <div className='flex items-center justify-center py-12'>
          <FontAwesomeIcon icon={faSpinner} className='h-8 w-8 animate-spin text-bcBluePrimary' />
        </div>
      );
    }

    if (suggestions?.message) {
      return (
        <div className='flex items-center justify-center py-12 text-gray-500'>
          {suggestions.message}
        </div>
      );
    }

    if (mergedSuggestions.length === 0) {
      return (
        <div className='flex items-center justify-center py-12 text-gray-500'>
          No additional occupations can cover remaining activities
        </div>
      );
    }

    return (
      <div className='relative'>
        {isLoading && (
          <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10'>
            <FontAwesomeIcon icon={faSpinner} className='h-8 w-8 animate-spin text-bcBluePrimary' />
          </div>
        )}

        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead className='bg-white'>
              <tr className='border-b border-gray-200'>
                <th className='px-3 py-3 text-left text-sm font-bold text-[#272833] w-[150px]'>
                  Suggested Occupations
                </th>
                <th className='px-3 py-3 text-left text-sm font-bold text-[#272833] w-[180px]'>
                  Competencies Covered
                </th>
                <th className='px-3 py-3 text-left text-sm font-bold text-[#272833]'>
                  Care Activities Covered
                </th>
                <th className='px-3 py-3 text-left text-sm font-bold text-[#272833]'>
                  Care Activities Covered With L&C
                </th>
                <th className='px-3 py-3 w-[130px]'></th>
              </tr>
            </thead>
            <tbody className='bg-white'>
              {mergedSuggestions.map((occupation, occIndex) => {
                const isSelected = tempSelected.has(occupation.occupationId);
                const competencies = occupation.competencies || [];
                const isFirstOccupation = occIndex === 0;

                if (competencies.length === 0) {
                  return (
                    <tr
                      key={occupation.occupationId}
                      className={`${!isFirstOccupation ? 'border-t border-gray-300' : ''} ${isSelected ? 'bg-[#fffbf0]' : ''}`}
                    >
                      <td className='px-3 py-3 align-top'>
                        <span className='font-bold text-sm text-[#272833]'>
                          {occupation.occupationName}
                        </span>
                        {occupation.simulatedCoverage && (
                          <SimulatedCoverageBadge
                            simulatedCoverage={occupation.simulatedCoverage}
                          />
                        )}
                      </td>
                      <td className='px-3 py-3 text-sm text-gray-400'>-</td>
                      <td className='px-3 py-3 text-sm text-gray-400'>-</td>
                      <td className='px-3 py-3 text-sm text-gray-400'>-</td>
                      <td className='px-3 py-3 text-right align-top'>
                        {renderActionButton(occupation, isSelected)}
                      </td>
                    </tr>
                  );
                }

                return competencies.map((competency, compIndex) => (
                  <tr
                    key={`${occupation.occupationId}-${competency.bundleId}`}
                    className={`${compIndex > 0 ? 'border-t border-gray-200' : ''} ${
                      compIndex === 0 && !isFirstOccupation ? 'border-t border-gray-300' : ''
                    } ${isSelected ? 'bg-[#fffbf0]' : ''}`}
                  >
                    {compIndex === 0 && (
                      <td className='px-3 py-3 align-top' rowSpan={competencies.length}>
                        <span className='font-bold text-sm text-[#272833]'>
                          {occupation.occupationName}
                        </span>
                        {occupation.simulatedCoverage && (
                          <SimulatedCoverageBadge
                            simulatedCoverage={occupation.simulatedCoverage}
                          />
                        )}
                      </td>
                    )}
                    <td className='px-3 py-3 text-sm text-[#313132] align-top'>
                      {competency.bundleName}
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {renderActivities(
                        competency.activitiesY,
                        false,
                        isSelected,
                        `${occupation.occupationId}-${competency.bundleId}-y`,
                      )}
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {renderActivities(
                        competency.activitiesLC,
                        true,
                        isSelected,
                        `${occupation.occupationId}-${competency.bundleId}-lc`,
                      )}
                    </td>
                    {compIndex === 0 && (
                      <td className='px-3 py-3 text-right align-top' rowSpan={competencies.length}>
                        {renderActionButton(occupation, isSelected)}
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        {suggestions && suggestions.total > 0 && (
          <Pagination
            id='suggestions-pagination'
            pageOptions={pageOptions}
            onChange={handlePageChange}
          />
        )}
      </div>
    );
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as='div'
        static
        className='fixed z-10 inset-0 overflow-y-auto'
        open={isOpen}
        onClose={handleClose}
      >
        <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
          </Transition.Child>

          <span className='hidden sm:inline-block sm:align-middle sm:h-screen' aria-hidden='true'>
            &#8203;
          </span>

          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            enterTo='opacity-100 translate-y-0 sm:scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 translate-y-0 sm:scale-100'
            leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          >
            <div className='relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full'>
              <div className='flex items-center justify-between border-b border-[#eaeaef] bg-[#f6f6f9] px-6 py-4 rounded-t-lg'>
                <Dialog.Title as='h3' className='text-lg font-semibold text-[#32324d]'>
                  Occupations suggestions
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  className='w-8 h-8 flex items-center justify-center border border-[#dcdce4] rounded bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  &times;
                </button>
              </div>

              <div className='px-6 pt-4'>
                <p className='text-base text-black mb-4'>
                  System suggestions to increase the coverage of care competencies/care activities
                  within the scope of practice.
                </p>
                <div className='bg-[#d9eaf7] border-2 border-[#d9eaf7] rounded px-4 py-3'>
                  <div className='flex items-start'>
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      className='h-6 w-6 text-[#1a5a96] mr-3 mt-0.5 shrink-0'
                    />
                    <p className='text-[17px] text-[#1a5a96] leading-6'>
                      Please confirm scope of practice in the occupations regulations.
                    </p>
                  </div>
                </div>
                {suggestions?.alerts && suggestions.alerts.length > 0 && (
                  <div className='mt-3'>
                    <SuggestionAlerts alerts={suggestions.alerts} />
                  </div>
                )}
              </div>

              <div className='p-6 overflow-y-auto max-h-[60vh]'>{renderContent()}</div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
