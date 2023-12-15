import { debounce } from 'lodash';
import { SearchBar } from '../generic/SearchBar';
import { Tag } from '../generic/Tag';
import { useCareActivitySearchTerms } from 'src/services/useCareActivitiesCommonSearchTerms';
import { TagVariants } from 'src/common';
import { MutableRefObject, SetStateAction } from 'react';

interface CareTerminologiesCommonSearchTermsProps {
  handleSearch: (text: string) => void;
}

export const CareTerminologiesCommonSearchTerms: React.FC<CareTerminologiesCommonSearchTermsProps> =
  ({ handleSearch }) => {
    const { careActivitySearchTerms, isLoading } = useCareActivitySearchTerms();

    if (isLoading || careActivitySearchTerms?.length === 0) return <></>;

    return (
      <>
        <div className='flex flex-initial w-full justify-start gap-3'>
          <p className='font-bold'>Common search topics:</p>
          {careActivitySearchTerms.map(searchTerm => (
            <Tag
              text={searchTerm}
              tagStyle={TagVariants.GRAY}
              className='cursor-pointer'
              onClick={handleSearch}
            />
          ))}
        </div>
      </>
    );
  };
