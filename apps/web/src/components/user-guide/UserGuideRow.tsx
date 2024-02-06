import { useCallback } from 'react';
import { UserGuide, formatDateTime } from '@tbcm/common';
import { useUserGuide } from 'src/services/useUserGuide';
import { Spinner } from '../generic/Spinner';

interface UserGuideProps {
  file: UserGuide;
}

export const UserGuideRow = ({ file }: UserGuideProps) => {
  const { fetchSignedUrl, isLoading } = useUserGuide();

  // fetch and open file in new tab
  const openFile = useCallback(
    (name: string) => {
      fetchSignedUrl(
        name,
        ({ url }) => window.open(url),
        'Something went wrong fetching file. Please try again later',
      );
    },
    [fetchSignedUrl],
  );

  // file row
  const getUserGuideRow = ({ name, lastModified }: UserGuide) => {
    return (
      <div className={`flex flex-row align-middle`} key={name}>
        {/* Last modified date-time */}
        <div style={{ minWidth: '180px' }}>{formatDateTime(lastModified)}</div>

        {/* clickable file name */}
        <div
          className='ml-4 underline text-bcBlueLink visited:text-bcBluePrimary cursor-pointer'
          onClick={e => {
            e.stopPropagation();
            openFile(name);
          }}
        >
          {name}
        </div>

        {/* loader */}
        {isLoading && (
          <div className='ml-4'>
            <Spinner show sm />
          </div>
        )}
      </div>
    );
  };

  return <div className='my-1'>{getUserGuideRow(file)}</div>;
};
