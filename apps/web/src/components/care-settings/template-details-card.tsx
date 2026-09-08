/**
 * Template Details Card
 *
 * The identity block shown on every step of the care settings wizard: what is
 * being edited, what it came from, and what level it sits at.
 *
 * Both the edit and copy wrappers render this so their titles and labels cannot
 * drift apart, which is what happened before — the edit wizard's "Edited from"
 * line showed the template's own name rather than its parent's.
 */
import { getTemplateLevelLabel, Role, TemplateLevel } from '@tbcm/common';
import { Button } from '../Button';
import { Card } from '../generic/Card';
import { useMe } from 'src/services/useMe';

interface TemplateDetailsCardProps {
  /** Name of the saved template. Ignored while `isSaved` is false. */
  templateName: string;
  parentName?: string;
  level?: TemplateLevel | null;
  /** False for a copy that has not been persisted yet. */
  isSaved: boolean;
  /** Sub-heading naming the current wizard step. */
  stepDescription: string;
  onEditDetailsClick?: () => void;
}

export const TemplateDetailsCard: React.FC<TemplateDetailsCardProps> = ({
  templateName,
  parentName,
  level,
  isSaved,
  stepDescription,
  onEditDetailsClick,
}) => {
  const { hasUserRole } = useMe();

  // Until it is saved the copy has no name of its own, so it is named after
  // what it came from.
  const title = isSaved ? templateName : `${parentName ?? ''} Copy`.trim();

  const canEditDetails =
    hasUserRole([Role.ADMIN, Role.CONTENT_ADMIN]) && Boolean(onEditDetailsClick);

  return (
    <Card bgWhite>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-bcBluePrimary'>{title}</h1>

          {parentName && (
            <p className='text-base text-gray-600 mt-1'>
              Edited from: <span className='font-semibold'>{parentName}</span>
            </p>
          )}

          {/* An unsaved copy has no level yet, so the row is omitted rather
              than shown blank or with a guessed value. */}
          {isSaved && (
            <p className='text-base text-gray-600 mt-1'>
              Template level:{' '}
              <span className='font-semibold'>{getTemplateLevelLabel(false, level)}</span>
            </p>
          )}
        </div>

        {canEditDetails && (
          <Button variant='secondary' type='button' onClick={onEditDetailsClick}>
            Edit Details
          </Button>
        )}
      </div>

      <p className='text-base text-gray-500 mt-2'>{stepDescription}</p>
    </Card>
  );
};
