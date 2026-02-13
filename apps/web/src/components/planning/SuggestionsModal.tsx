import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faSpinner, faInfoCircle, faList, faTimes } from '@fortawesome/free-solid-svg-icons';
import { CareActivityType, OccupationSuggestionRO, SuggestionResponseRO } from '@tbcm/common';
import { usePlanningContext } from '../../services/usePlanningContext';
import { useSuggestions } from '../../services/useSuggestions';
import { Pagination, PageOptions } from '../Pagination';
import { Popover, PopoverPosition } from '../generic/Popover';
import { Button, buttonBase, buttonColor } from '../Button';

// Activity type colors used for text coloring and legend
// Colors match the tag styles in util.ts: RESTRICTED→teal, ASPECT→yellow, TASK→green
const ACTIVITY_TYPE_COLORS: Record<CareActivityType, string> = {
  [CareActivityType.RESTRICTED_ACTIVITY]: '#095954', // Teal (bcDarkTeal)
  [CareActivityType.ASPECT_OF_PRACTICE]: '#664B07', // Dark yellow (bcDarkYellow)
  [CareActivityType.TASK]: '#2D4821', // Green (bcBannerSuccessText)
};

// Static Tailwind classes - must be complete strings for JIT to detect them
const ACTIVITY_TYPE_TEXT_CLASSES: Record<CareActivityType, string> = {
  [CareActivityType.RESTRICTED_ACTIVITY]: 'text-[#095954]',
  [CareActivityType.ASPECT_OF_PRACTICE]: 'text-[#664B07]',
  [CareActivityType.TASK]: 'text-[#2D4821]',
};

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(new Set());
      setTempSelectedData(new Map());
      setSuggestions(null);
      setPageOptions({ pageIndex: 1, pageSize: 10, total: 0 });
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

  // Get color class based on activity type
  const getActivityTypeColor = (activityType: CareActivityType): string => {
    return ACTIVITY_TYPE_TEXT_CLASSES[activityType] || 'text-[#313132]';
  };

  // Render activities with colors based on activity type
  const renderActivities = (
    activities: { activityId: string; activityName: string; activityType: CareActivityType }[],
  ) => {
    if (activities.length === 0) return <span className='text-gray-400'>-</span>;

    return (
      <span className='text-sm leading-6'>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.activityId}>
            <span className={getActivityTypeColor(activity.activityType)}>
              {activity.activityName}
            </span>
            {index < activities.length - 1 && <span className='text-[#313132]'>, </span>}
          </React.Fragment>
        ))}
      </span>
    );
  };

  // Legend items for activity types
  const activityTypeLegend = [
    {
      type: 'Restricted Activity',
      color: ACTIVITY_TYPE_COLORS[CareActivityType.RESTRICTED_ACTIVITY],
      description:
        'Restricted activities are a narrowly defined list of invasive, higher risk activities and are written in health profession specific regulations.',
    },
    {
      type: 'Aspect of Practice',
      color: ACTIVITY_TYPE_COLORS[CareActivityType.ASPECT_OF_PRACTICE],
      description:
        'Aspects of Practice are care activities, other than a restricted activity, which are part of providing a health service that is within the scope of practice of a designated health profession.',
    },
    {
      type: 'Task',
      color: ACTIVITY_TYPE_COLORS[CareActivityType.TASK],
      description:
        "Tasks are lower risk care activities which are not a 'restricted activity' or an 'aspect of practice.'",
    },
  ];

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
                      </td>
                    )}
                    <td className='px-3 py-3 text-sm text-[#313132] align-top'>
                      {competency.bundleName}
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {renderActivities(competency.activitiesY)}
                    </td>
                    <td className='px-3 py-3 align-top'>
                      {renderActivities(competency.activitiesLC)}
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
                <div className='flex items-start justify-between gap-4 mb-4'>
                  <p className='text-base text-black'>
                    System suggestions to increase the coverage of care competencies/care activities
                    within the scope of practice.
                  </p>
                  <Popover
                    title={
                      <span className={`${buttonBase} ${buttonColor.secondary}`}>
                        Legend
                        <FontAwesomeIcon icon={faList} className='h-4 ml-2 mr-1' />
                      </span>
                    }
                    position={PopoverPosition.BOTTOM_LEFT}
                  >
                    {(close: () => void) => (
                      <div className='legend-box w-[24rem] lg:w-[36rem]'>
                        <h2>Activity Types</h2>
                        <ul className='flex flex-col items-start my-4'>
                          {activityTypeLegend.map((item, index) => (
                            <li
                              key={`legend-${index}`}
                              className='flex items-start my-2 gap-3'
                            >
                              <span
                                className='w-4 h-4 rounded-full shrink-0 mt-1'
                                style={{ backgroundColor: item.color }}
                              />
                              <div>
                                <span className='font-semibold' style={{ color: item.color }}>
                                  {item.type}
                                </span>
                                <p className='text-sm text-gray-600 mt-1'>{item.description}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <Button variant='outline' type='button' classes='ml-2' onClick={close}>
                          <FontAwesomeIcon icon={faTimes} className='h-4 mr-2' />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </Popover>
                </div>
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
              </div>

              <div className='p-6 overflow-y-auto max-h-[60vh]'>{renderContent()}</div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
