import { useEffect, useState } from 'react';
import { Spinner } from '../generic/Spinner';
import { UserGuideRow } from './UserGuideRow';
import { useUserGuide } from 'src/services/useUserGuide';
import { UserGuide } from '@tbcm/common';
import { AppErrorMessage } from '../AppErrorMessage';

export const UserGuideList = () => {
  const { fetchFiles, isLoading } = useUserGuide();
  const [files, setFiles] = useState<UserGuide[]>();
  const [errorMessage, setErrorMessage] = useState<string>('');

  // fetch documents
  useEffect(() => {
    fetchFiles(files => {
      setFiles(files);
    });
  }, [fetchFiles]);

  // error handling
  useEffect(() => {
    setErrorMessage(''); // reset error message

    if (!files) {
      setErrorMessage('Something went wrong fetching files. Please try again later');
    } else if (!files.length) {
      setErrorMessage('No files found!');
    }
  }, [files]);

  // loader
  if (isLoading) {
    return <Spinner show />;
  }

  // error message
  if (errorMessage) {
    return <AppErrorMessage message={errorMessage} />;
  }

  // list view
  return (
    <>
      {files?.map(file => (
        <UserGuideRow key={file.name} file={file} />
      ))}
    </>
  );
};
