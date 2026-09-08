import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { Button, buttonColor } from './Button';

export interface ModalProps {
  open: boolean;
  handleClose?: () => void;
  containerClassName?: string;
}

const { Root, Child } = Transition;

const ModalContainer: React.FC<PropsWithChildren<ModalProps>> = ({
  children,
  open,
  handleClose = void 0,
  containerClassName,
}) => {
  return (
    <Root show={open} as={Fragment}>
      <Dialog
        as='div'
        static
        className='fixed z-10 inset-0 overflow-y-auto'
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
            <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
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
            <div
              className={`inline-block align-bottom bg-white rounded-[4px] text-left shadow-[4px_7px_25px_rgba(0,0,0,0.05)] transform transition-all sm:my-8 sm:align-middle sm:w-full p-[24px] ${
                containerClassName ?? 'sm:max-w-[652px]'
              }`}
            >
              <div className='bg-white rounded-[4px]'>{children}</div>
            </div>
          </Child>
        </div>
      </Dialog>
    </Root>
  );
};

interface ModalInterface extends React.FC<PropsWithChildren<ModalProps>> {
  Title: typeof Dialog.Title;
  Description: typeof Dialog.Description;
}

const Modal = ModalContainer as ModalInterface;
Modal.Title = Dialog.Title;
Modal.Description = Dialog.Description;

const ModalFooter = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      className={`bg-transparent border-t border-gray-200 pt-4 mt-2 flex flex-row-reverse gap-4 items-center pr-0 ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  );
};

interface ModalButtonProps {
  title: string;
  type?: 'submit' | 'reset' | 'button';
  onClick?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  variant?: keyof typeof buttonColor;
  classes?: string;
}

interface ModalWrapperProps {
  isOpen: boolean;
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
  title?: string;
  description?: string | React.ReactElement;
  closeButton?: ModalButtonProps;
  actionButton?: ModalButtonProps;
  children?: ReactNode;
  headerRight?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  footerClassName?: string;
  containerClassName?: string;
}

export const ModalWrapper = ({
  isOpen,
  setIsOpen,
  title,
  description,
  closeButton,
  actionButton,
  children,
  headerRight,
  titleClassName,
  descriptionClassName,
  footerClassName,
  containerClassName,
}: ModalWrapperProps) => {
  const modalButtonClasses = 'box-border h-12 border-2 px-6 py-2 text-base font-bold';

  return (
    <Modal open={isOpen} containerClassName={containerClassName}>
      {(title || headerRight) && (
        <div className='flex items-center justify-between border-b border-gray-200 pb-3 mb-4'>
          {title && (
            <Modal.Title
              as='h1'
              className={titleClassName || 'text-lg font-semibold leading-6 text-bcBluePrimary'}
            >
              {title}
            </Modal.Title>
          )}
          {headerRight}
        </div>
      )}

      {description && (
        <Modal.Description as='div' className={descriptionClassName || 'text-sm'}>
          {description}
        </Modal.Description>
      )}

      {children}

      {(actionButton || closeButton) && (
        <ModalFooter className={footerClassName}>
          {actionButton && (
            <Button
              loading={actionButton?.isLoading}
              onClick={() => actionButton?.onClick?.()}
              variant={actionButton.variant ?? (actionButton.isError ? 'error' : 'primary')}
              type={actionButton.type || 'button'}
              disabled={actionButton.isDisabled}
              classes={`${modalButtonClasses} ${actionButton.classes ?? ''}`}
            >
              {actionButton.title}
            </Button>
          )}

          {closeButton && (
            <Button
              onClick={() => (closeButton?.onClick ? closeButton?.onClick?.() : setIsOpen(false))}
              variant={
                closeButton.variant ??
                `${closeButton.isError ? 'error' : actionButton ? 'secondary' : 'primary'}`
              }
              type={closeButton?.type || 'button'}
              disabled={closeButton.isDisabled}
              classes={`${modalButtonClasses} ${closeButton.classes ?? ''}`}
            >
              {closeButton?.title || 'Ok'}
            </Button>
          )}
        </ModalFooter>
      )}
    </Modal>
  );
};
