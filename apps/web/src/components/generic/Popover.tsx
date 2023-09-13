import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover as PopoverUI, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface PopoverProps {
  title: string;
}

export const Popover: React.FC<PopoverProps> = ({ title, children }) => {
  return (
    <PopoverUI className='relative'>
      {({ open, close }) => (
        <>
          <PopoverUI.Button
            className={`${
              open ? '' : 'text-opacity-100'
            } ml-2 text-sm font-strong text-bcBluePrimary mb-4 group inline-flex items-center rounded-md hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
          >
            <span>{title}</span>
          </PopoverUI.Button>

          <Transition
            as={Fragment}
            enter='transition ease-out duration-200'
            enterFrom='opacity-0 translate-y-1'
            enterTo='opacity-100 translate-y-0'
            leave='transition ease-in duration-150'
            leaveFrom='opacity-100 translate-y-0'
            leaveTo='opacity-0 translate-y-1'
          >
            <PopoverUI.Panel className='absolute left-1/4 top-5 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl'>
              <div className='overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5'>
                {children}
              </div>
              <div
                className='absolute right-0 top-0 font-strong cursor-pointer'
                onClick={() => close()}
              >
                <FontAwesomeIcon title='Close' icon={faTimes} className='h-5 m-4' />
              </div>
            </PopoverUI.Panel>
          </Transition>
        </>
      )}
    </PopoverUI>
  );
};
