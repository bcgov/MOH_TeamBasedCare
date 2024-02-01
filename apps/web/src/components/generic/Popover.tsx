import { Popover as PopoverUI, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

export enum PopoverPosition {
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
}
interface PopoverProps {
  title: string | JSX.Element;
  children: (close: () => void) => ReactNode;
  position?: 'bottom-right' | 'bottom-left';
}

export const Popover: React.FC<PopoverProps> = ({ title, children, position = 'bottom-right' }) => {
  return (
    <PopoverUI className='relative'>
      {({ open, close }) => (
        <>
          <PopoverUI.Button className={`${open ? '' : 'text-opacity-90'}`}>
            {title}
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
            <PopoverUI.Panel
              className={`absolute left-1/2 top-7 ${
                position === 'bottom-left' && '-translate-x-full'
              } z-10 max-w-sm transform lg:max-w-3xl`}
            >
              <div className='overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5'>
                {children?.(close)}
              </div>
            </PopoverUI.Panel>
          </Transition>
        </>
      )}
    </PopoverUI>
  );
};
