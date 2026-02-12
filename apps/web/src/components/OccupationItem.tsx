import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faBan } from '@fortawesome/free-solid-svg-icons';
import { ModalWrapper } from './Modal';

interface ExtendedOccupationItemProps extends OccupationItemProps {
  showDescriptionModal?: boolean;
  isUnavailable?: boolean;
  onToggleUnavailable?: (id: string) => void;
}

export const OccupationItem = ({
  id,
  displayName,
  description,
  showDescriptionModal,
  isUnavailable = false,
  onToggleUnavailable,
}: ExtendedOccupationItemProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={`flex flex-1 items-center ${isUnavailable ? 'bg-red-50' : ''}`}>
      <div className='flex-initial w-full flex flex-row items-center justify-between'>
        <Checkbox
          name='occupation'
          value={id}
          styles={`text-bcDarkBlue accent-bcBlueLink ${isUnavailable ? 'line-through text-gray-400' : ''}`}
          label={displayName}
        ></Checkbox>

        <div className='flex items-center'>
          {/* Unavailable toggle button */}
          {onToggleUnavailable && (
            <button
              type='button'
              onClick={e => {
                e.preventDefault();
                onToggleUnavailable(id);
              }}
              className={`px-2 py-1 text-xs rounded mr-2 flex items-center gap-1 ${
                isUnavailable
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
              title={isUnavailable ? 'Mark as available' : 'Mark as unavailable'}
            >
              <FontAwesomeIcon icon={faBan} className='h-3 w-3' />
              {isUnavailable ? 'Unavailable' : 'Mark unavailable'}
            </button>
          )}

          {/* Only show the description modal, if requested */}
          {showDescriptionModal && (
            <>
              <FontAwesomeIcon
                title='More information'
                icon={faInfoCircle}
                className='text-bcBluePrimary cursor-pointer h-4 px-2 flex align-center'
                onClick={() => setShowModal(true)}
              />

              <ModalWrapper
                isOpen={showModal}
                setIsOpen={setShowModal}
                title={displayName}
                description={description || 'No description available'}
                closeButton={{ title: 'Ok' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
