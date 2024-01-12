import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  handleClose?: () => void;
}

const { Root, Child } = Transition;

const ModalContainer: React.FC<ModalProps> = ({ children, open, handleClose = void 0 }) => {
  return (
    <Root show={open} as={Fragment}>
      <Dialog
        as='div'
        static
        className='fixed z-50 inset-0 overflow-y-auto'
        open={open}
        onClose={() => handleClose?.()}
      >
        <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
          <Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Dialog.Overlay className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
          </Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className='hidden sm:inline-block sm:align-middle sm:h-screen' aria-hidden='true'>
            &#8203;
          </span>
          <Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            enterTo='opacity-100 translate-y-0 sm:scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 translate-y-0 sm:scale-100'
            leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          >
            <div className='inline-block align-bottom bg-white rounded text-left shadow-xl transform transition-all sm:my-8 sm:align-middle lg:max-w-xl sm:max-w-lg sm:w-full p-1'>
              <div className='bg-white '>{children}</div>
            </div>
          </Child>
        </div>
      </Dialog>
    </Root>
  );
};

interface ModalInterface extends React.FC<ModalProps> {
  Title: typeof Dialog.Title;
  Description: typeof Dialog.Description;
}

const Modal = ModalContainer as ModalInterface;
Modal.Title = Dialog.Title;
Modal.Description = Dialog.Description;

const ModalFooter = ({ children }: PropsWithChildren<ReactNode>) => {
  return (
    <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3'>{children}</div>
  );
};

interface ModalButtonProps {
  title: string;
  type?: 'submit' | 'reset' | 'button';
  onClick?: () => void;
}

interface ModalWrapperProps {
  isOpen: boolean;
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
  title?: string;
  description?: string;
  closeButton?: ModalButtonProps;
  actionButton?: ModalButtonProps;
  children?: ReactNode;
}

export const ModalWrapper = ({
  isOpen,
  setIsOpen,
  title,
  description,
  closeButton,
  actionButton,
  children,
}: ModalWrapperProps) => {
  return (
    <Modal open={isOpen}>
      <Modal.Title
        as='h1'
        className='text-lg font-medium leading-6 text-bcBluePrimary border-b p-4'
      >
        {title}
      </Modal.Title>

      <Modal.Description className='p-5 flex gap-5 flex-col text-sm'>
        {description}
        {children}
      </Modal.Description>

      {(actionButton || closeButton) && (
        <ModalFooter>
          {actionButton && (
            <Button
              onClick={() => actionButton?.onClick?.()}
              variant='primary'
              type={actionButton.type || 'button'}
            >
              {actionButton.title}
            </Button>
          )}

          {closeButton && (
            <Button
              onClick={() => (closeButton?.onClick ? closeButton?.onClick?.() : setIsOpen(false))}
              variant={`${actionButton ? 'secondary' : 'primary'}`}
              type={closeButton?.type || 'button'}
            >
              {closeButton?.title || 'Ok'}
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
};
