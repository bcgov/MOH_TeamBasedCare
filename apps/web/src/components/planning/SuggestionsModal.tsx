import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { CareActivityType, OccupationSuggestionRO, SuggestionResponseRO } from '@tbcm/common';
import { usePlanningContext } from '../../services/usePlanningContext';
import { useSuggestions } from '../../services/useSuggestions';
import { Pagination, PageOptions } from '../Pagination';
import { Tag } from '../generic/Tag';
import { TagVariants } from '../../common/constants';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: (selectedIds: string[]) => void;
}

const getActivityTypeStyle = (activityType: CareActivityType): string => {
  switch (activityType) {
    case CareActivityType.RESTRICTED_ACTIVITY:
      return 'bg-[#013366] text-white';
    case CareActivityType.ASPECT_OF_PRACTICE:
      return TagVariants.YELLOW;
    case CareActivityType.TASK:
      return TagVariants.GREEN;
    default:
      return TagVariants.BASE;
  }
};

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
      setPageOptions(prev => ({ ...prev, pageIndex: 1, total: 0 }));
    }
  }, [isOpen]);

  const fetchSuggestions = useCallback(() => {
    if (!sessionId) return;

    getSuggestions(
      {
        sessionId,
        tempSelectedIds: Array.from(tempSelected),
        page: pageOptions.pageIndex,
        pageSize: pageOptions.pageSize,
      },
      (data: SuggestionResponseRO) => {
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

  const renderActivityTags = (
    activities: { activityId: string; activityName: string; activityType: CareActivityType }[],
  ) => {
    if (activities.length === 0) return <span className='text-gray-400'>-</span>;

    return (
      <div className='flex flex-wrap gap-1'>
        {activities.map(activity => {
          const style = getActivityTypeStyle(activity.activityType);
          const isCustomStyle = style.startsWith('bg-');

          if (isCustomStyle) {
            return (
              <span
                key={activity.activityId}
                className={`tag ${style} px-2 py-1 text-xs rounded`}
                title={activity.activityType}
              >
                {activity.activityName}
              </span>
            );
          }

          return (
            <Tag
              key={activity.activityId}
              text={activity.activityName}
              tagStyle={style as TagVariants}
              className='text-xs'
            />
          );
        })}
      </div>
    );
  };

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
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-semibold text-bcBluePrimary uppercase tracking-wider w-48'>
                  Suggested Occupations
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-bcBluePrimary uppercase tracking-wider w-40'>
                  Competencies Covered
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-bcBluePrimary uppercase tracking-wider'>
                  Care Activities Covered
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-bcBluePrimary uppercase tracking-wider'>
                  Care Activities Covered With L&C
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {mergedSuggestions.map(occupation => {
                const isSelected = tempSelected.has(occupation.occupationId);
                const competencies = occupation.competencies || [];

                if (competencies.length === 0) {
                  return (
                    <tr key={occupation.occupationId} className='hover:bg-gray-50'>
                      <td className='px-4 py-4'>
                        <div className='flex flex-col gap-2'>
                          <span className='font-medium text-sm'>{occupation.occupationName}</span>
                          <button
                            onClick={() => handleAddToTeam(occupation)}
                            disabled={isLoading}
                            className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected
                                ? 'bg-bcBluePrimary text-white'
                                : 'border-2 border-bcBluePrimary text-bcBluePrimary hover:bg-gray-100'
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={isSelected ? faCheck : faPlus}
                              className='h-3 w-3'
                            />
                            {isSelected ? 'Added' : 'Add to team'}
                          </button>
                        </div>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-400'>-</td>
                      <td className='px-4 py-4 text-sm text-gray-400'>-</td>
                      <td className='px-4 py-4 text-sm text-gray-400'>-</td>
                    </tr>
                  );
                }

                return competencies.map((competency, compIndex) => (
                  <tr
                    key={`${occupation.occupationId}-${competency.bundleId}`}
                    className='hover:bg-gray-50'
                  >
                    {compIndex === 0 && (
                      <td className='px-4 py-4' rowSpan={competencies.length}>
                        <div className='flex flex-col gap-2'>
                          <span className='font-medium text-sm'>{occupation.occupationName}</span>
                          <button
                            onClick={() => handleAddToTeam(occupation)}
                            disabled={isLoading}
                            className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected
                                ? 'bg-bcBluePrimary text-white'
                                : 'border-2 border-bcBluePrimary text-bcBluePrimary hover:bg-gray-100'
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={isSelected ? faCheck : faPlus}
                              className='h-3 w-3'
                            />
                            {isSelected ? 'Added' : 'Add to team'}
                          </button>
                        </div>
                      </td>
                    )}
                    <td className='px-4 py-4 text-sm font-medium'>{competency.bundleName}</td>
                    <td className='px-4 py-4'>{renderActivityTags(competency.activitiesY)}</td>
                    <td className='px-4 py-4'>{renderActivityTags(competency.activitiesLC)}</td>
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
      <Dialog as='div' className='fixed z-10 inset-0 overflow-y-auto' onClose={handleClose}>
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
            <div className='inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full'>
              <div className='flex items-center justify-between border-b px-6 py-4'>
                <Dialog.Title as='h3' className='text-lg font-semibold text-bcBluePrimary'>
                  Suggestions
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  className='text-gray-400 hover:text-gray-600 text-2xl font-light'
                >
                  &times;
                </button>
              </div>

              <div className='bg-blue-50 border-l-4 border-bcBluePrimary px-4 py-3 mx-6 mt-4'>
                <div className='flex items-start'>
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    className='h-5 w-5 text-bcBluePrimary mr-2 mt-0.5'
                  />
                  <p className='text-sm text-bcBluePrimary'>
                    Please confirm scope of practice in the occupations regulations.
                  </p>
                </div>
              </div>

              <div className='p-6'>{renderContent()}</div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
