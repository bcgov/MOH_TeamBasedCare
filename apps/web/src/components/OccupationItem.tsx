import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ModalWrapper } from './Modal';

export const OccupationItem = ({
  id,
  displayName,
  description,
  showDescriptionModal,
}: OccupationItemProps & { showDescriptionModal?: boolean }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className='flex flex-1 items-center'>
      <div className='flex-initial w-full flex flex-row items-center justify-between'>
        <Checkbox
          name='occupation'
          value={id}
          styles='text-bcDarkBlue accent-bcBlueLink'
          label={displayName}
        ></Checkbox>

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
  );
};
