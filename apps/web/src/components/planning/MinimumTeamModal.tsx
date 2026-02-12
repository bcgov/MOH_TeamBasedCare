import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { MinimumTeamResponseRO } from '@tbcm/common';
import { useMinimumTeam } from '../../services/useMinimumTeam';
import { Button } from '../Button';
import { Alert } from '../Alert';

interface MinimumTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onApply: (occupationIds: string[]) => void;
}

export const MinimumTeamModal: React.FC<MinimumTeamModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onApply,
}) => {
  const { getMinimumTeam, isLoading } = useMinimumTeam();
  const [result, setResult] = useState<MinimumTeamResponseRO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      setError(null);
      setResult(null);
      getMinimumTeam(
        sessionId,
        data => setResult(data),
        () => setError('Failed to calculate minimum team'),
      );
    }
  }, [isOpen, sessionId, getMinimumTeam]);

  const handleApply = () => {
    if (result) {
      onApply(result.occupationIds);
      onClose();
    }
  };

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
                  Minimum Team Calculator
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className='w-8 h-8 flex items-center justify-center border border-[#dcdce4] rounded bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                >
                  &times;
                </button>
              </div>

              <div className='p-6'>
                {isLoading && (
                  <div className='flex items-center justify-center py-8'>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className='animate-spin h-8 w-8 text-blue-500'
                    />
                    <span className='ml-3 text-gray-600'>Calculating minimum team...</span>
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
                      <span className='text-gray-700'>Coverage achieved:</span>
                      <span className='text-2xl font-bold text-green-600'>
                        {result.achievedCoverage}%
                      </span>
                    </div>

                    {result.isFullCoverage && (
                      <div className='flex items-center text-green-600'>
                        <FontAwesomeIcon icon={faCheck} className='mr-2' />
                        <span className='font-medium'>100% coverage achieved</span>
                      </div>
                    )}

                    <div>
                      <h4 className='font-semibold text-gray-900 mb-2'>
                        Minimum team ({result.occupationNames.length} occupations):
                      </h4>
                      <ol className='list-decimal list-inside space-y-1 text-gray-700'>
                        {result.occupationNames.map((name, index) => (
                          <li key={result.occupationIds[index]}>{name}</li>
                        ))}
                      </ol>
                    </div>

                    {result.uncoveredActivityNames.length > 0 && (
                      <Alert type='warning'>
                        <div>
                          <p className='font-medium'>
                            {result.uncoveredActivityNames.length} activities cannot be covered:
                          </p>
                          <ul className='list-disc list-inside mt-1 text-sm'>
                            {result.uncoveredActivityNames.slice(0, 5).map((name, i) => (
                              <li key={i}>{name}</li>
                            ))}
                            {result.uncoveredActivityNames.length > 5 && (
                              <li>...and {result.uncoveredActivityNames.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              <div className='bg-gray-50 px-6 py-4 flex justify-end space-x-3'>
                <Button variant='secondary' onClick={onClose}>
                  Close
                </Button>
                {result && result.occupationIds.length > 0 && (
                  <Button variant='primary' onClick={handleApply}>
                    Apply to Team
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
