import { faChevronDown, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Disclosure as HeadlessDisclosure, Transition } from '@headlessui/react';
import { useCallback } from 'react';

interface DisclosureProps {
  buttonText: React.ReactNode;
  content: React.ReactNode;
  shouldExpand?: boolean;
  bgClass?: string;
  onChange?: (open: boolean) => void;
  btnIcon?: IconDefinition;
  btnBorder?: boolean;
  dropdownIconPosition?: 'left' | 'right';
}

export const Disclosure: React.FC<DisclosureProps> = ({
  buttonText,
  content,
  shouldExpand,
  bgClass = '',
  onChange,
  btnIcon,
  btnBorder = false,
  dropdownIconPosition = 'right',
}) => {
  const caretIcon = useCallback(
    open => (
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`h-3 w-3 my-auto ${open ? 'transform rotate-180 duration-300' : 'duration-300'}`}
      />
    ),
    [],
  );

  return (
    <HeadlessDisclosure defaultOpen={shouldExpand}>
      {({ open }) => (
        <div
          className={`${btnBorder ? 'border border-gray-200 rounded' : ''}`}
          onClick={() => onChange?.(!open)}
        >
          <HeadlessDisclosure.Button className={`${bgClass} rounded-b-none flex justify-between`}>
            {dropdownIconPosition === 'left' && caretIcon(open)}

            {btnIcon && (
              <FontAwesomeIcon icon={btnIcon} className='text-bcBlueLink h-4 w-4 my-auto' />
            )}

            <div className='flex flex-row p-2 text-left text-bcBlueLink'>{buttonText}</div>

            {dropdownIconPosition === 'right' && caretIcon(open)}
          </HeadlessDisclosure.Button>
          <Transition
            enter='transition ease-in duration-500 transform'
            enterFrom='opacity-0 '
            enterTo='opacity-100 '
            leave='transition ease duration-100 transform'
            leaveFrom='opacity-100 '
            leaveTo='opacity-0 '
          >
            <HeadlessDisclosure.Panel>{content}</HeadlessDisclosure.Panel>
          </Transition>
        </div>
      )}
    </HeadlessDisclosure>
  );
};
