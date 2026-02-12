import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { RedundancyAnalysisResponseRO, RedundantOccupationRO } from '@tbcm/common';
import { useRedundancyAnalysis } from '../../services/useRedundancyAnalysis';
import { Button } from '../Button';
import { Alert } from '../Alert';

interface RedundancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onRemove: (occupationIds: string[]) => void;
}

export const RedundancyModal: React.FC<RedundancyModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onRemove,
}) => {
  const { getRedundantOccupations, isLoading } = useRedundancyAnalysis();
  const [result, setResult] = useState<RedundancyAnalysisResponseRO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && sessionId) {
      setError(null);
      setResult(null);
      setSelectedIds(new Set());
      getRedundantOccupations(
        sessionId,
        data => setResult(data),
        () => setError('Failed to analyze team redundancy'),
      );
    }
  }, [isOpen, sessionId, getRedundantOccupations]);

  const toggleSelection = (occupationId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(occupationId)) {
        newSet.delete(occupationId);
      } else {
        newSet.add(occupationId);
      }
      return newSet;
    });
  };

  const handleRemove = () => {
    if (selectedIds.size > 0) {
      onRemove(Array.from(selectedIds));
      onClose();
    }
  };

  const renderOccupation = (occupation: RedundantOccupationRO, isRemovable: boolean) => (
    <div
      key={occupation.occupationId}
      className={`flex items-start p-3 rounded-lg ${isRemovable ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
    >
      {isRemovable && (
        <input
          type='checkbox'
          checked={selectedIds.has(occupation.occupationId)}
          onChange={() => toggleSelection(occupation.occupationId)}
          className='mt-1 mr-3 h-4 w-4 text-blue-600 rounded border-gray-300'
        />
      )}
      <div className='flex-1'>
        <div className='flex items-center'>
          {!isRemovable && (
            <FontAwesomeIcon icon={faCheck} className='text-green-500 mr-2 h-4 w-4' />
          )}
          <span className={`font-medium ${isRemovable ? 'text-yellow-800' : 'text-gray-900'}`}>
            {occupation.occupationName}
          </span>
        </div>
        {!isRemovable && occupation.uniqueActivities.length > 0 && (
          <p className='text-sm text-gray-600 mt-1'>
            Uniquely covers: {occupation.uniqueActivities.slice(0, 3).join(', ')}
            {occupation.uniqueActivities.length > 3 &&
              ` +${occupation.uniqueActivities.length - 3} more`}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as='div'
        className='fixed z-10 inset-0 overflow-y-auto'
        open={isOpen}
        onClose={onClose}
      >
        <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0'>
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

          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            enterTo='opacity-100 translate-y-0 sm:scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 translate-y-0 sm:scale-100'
            leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          >
            <div className='relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='flex items-center justify-between border-b border-[#eaeaef] bg-[#f6f6f9] px-6 py-4 rounded-t-lg'>
                <Dialog.Title as='h3' className='text-lg font-semibold text-[#32324d]'>
                  Team Optimization
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className='w-8 h-8 flex items-center justify-center border border-[#dcdce4] rounded bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  &times;
                </button>
              </div>

              <div className='p-6 max-h-[60vh] overflow-y-auto'>
                {isLoading && (
                  <div className='flex items-center justify-center py-8'>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className='animate-spin h-8 w-8 text-blue-500'
                    />
                    <span className='ml-3 text-gray-600'>Analyzing team redundancy...</span>
                  </div>
                )}

                {error && (
                  <Alert type='error'>
                    <p>{error}</p>
                  </Alert>
                )}

                {result && !isLoading && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between bg-gray-50 rounded-lg p-4'>
                      <span className='text-gray-700'>Current coverage:</span>
                      <span className='text-2xl font-bold text-blue-600'>
                        {result.currentCoverage}%
                      </span>
                    </div>

                    {result.removableOccupations.length > 0 ? (
                      <div>
                        <div className='flex items-center mb-2'>
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className='text-yellow-500 mr-2'
                          />
                          <h4 className='font-semibold text-gray-900'>
                            {result.removableOccupations.length} occupation
                            {result.removableOccupations.length > 1 ? 's' : ''} can be removed
                            without reducing coverage:
                          </h4>
                        </div>
                        <div className='space-y-2'>
                          {result.removableOccupations.map(occ => renderOccupation(occ, true))}
                        </div>
                      </div>
                    ) : (
                      <Alert type='success'>
                        <p>All team members are essential - no redundant occupations found.</p>
                      </Alert>
                    )}

                    {result.essentialOccupations.length > 0 && (
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2 flex items-center'>
                          <FontAwesomeIcon icon={faCheck} className='text-green-500 mr-2' />
                          {result.essentialOccupations.length} essential occupation
                          {result.essentialOccupations.length > 1 ? 's' : ''}:
                        </h4>
                        <div className='space-y-2'>
                          {result.essentialOccupations.map(occ => renderOccupation(occ, false))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className='bg-gray-50 px-6 py-4 flex justify-end space-x-3'>
                <Button variant='secondary' onClick={onClose}>
                  Close
                </Button>
                {result && selectedIds.size > 0 && (
                  <Button variant='error' onClick={handleRemove}>
                    Remove Selected ({selectedIds.size})
                  </Button>
                )}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
