import React from 'react';
import { Button } from '@components';
import { usePlanningContext } from '../../services';

export interface OptionType {
  headerTitle: string;
  bodyText: string;
}

interface DropdownProps {
  headerTitle?: string;
  bodyText?: string;
}

export const Modal: React.FC<DropdownProps> = ({ bodyText, headerTitle }) => {
  const {
    state: { showModal },
    updateShowModal,
    updateCanProceedToPrevious,
  } = usePlanningContext();

  const handleProceed = () => {
    updateShowModal(false);
    updateCanProceedToPrevious(true);
  };

  return (
    <>
      {showModal ? (
        <>
          <div className='justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none'>
            <div className='relative w-auto my-6 mx-auto max-w-3xl'>
              {/*content*/}
              <div className='border-0 p-4 rounded shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none'>
                {/*header*/}
                <div className='flex items-start pb-4 justify-between border-b border-solid border-slate-200 rounded-t'>
                  <h3 className='text-3xl text-bcBluePrimary'>{headerTitle}</h3>
                  <button
                    className='p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none'
                    onClick={() => updateShowModal(false)}
                  >
                    <span className='bg-transparent text-bcBluePrimary opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none'>
                      ×
                    </span>
                  </button>
                </div>

                {/*body*/}
                <div className='relative flex-auto'>
                  <p className='my-4 text-slate-500 leading-relaxed'>{bodyText}</p>
                </div>

                {/*footer*/}
                <div className='flex items-center justify-end pt-4 border-t border-solid border-slate-200 rounded-b'>
                  <Button
                    variant='outline'
                    type='button'
                    classes={`ml-2`}
                    onClick={() => updateShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    type='button'
                    classes={`ml-2`}
                    onClick={() => handleProceed()}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className='opacity-25 fixed inset-0 z-40 bg-black'></div>
        </>
      ) : null}
    </>
  );
};
