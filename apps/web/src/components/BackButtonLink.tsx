import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useAppContext } from './AppContext';
import { Button } from './Button';

interface BackButtonLinkProps {
  path?: string;
}

export const BackButtonLink: React.FC<BackButtonLinkProps> = ({ path }) => {
  const { updateActivePath } = useAppContext();
  const router = useRouter();

  return (
    <Button
      variant='link'
      classes='flex flex-row gap-1 text-bcBlueLink font-bold'
      onClick={() => {
        if (path) {
          updateActivePath(path);
        } else {
          router.back();
        }
      }}
    >
      <FontAwesomeIcon className='w-3 h-3 my-auto' icon={faChevronLeft} />
      Back
    </Button>
  );
};
