import { faCloudUploadAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';
import { Alert } from './Alert';
import { Spinner } from './generic/Spinner';

interface FileUploadProps {
  id: string;
  accept?: string;
  maxFileSize?: number; // in bytes
  maxFileSizeText?: string;
  handleErrorBeforeSelection?: (selectedFile: File) => void;
  handleFile: (selectedFile: File) => Promise<void>;
  handleFileErrorRemove?: () => void;
  loading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  accept,
  maxFileSize = 25000000,
  maxFileSizeText = '25 MB',
  handleErrorBeforeSelection,
  handleFile,
  handleFileErrorRemove,
  loading = false,
}) => {
  const [file, setFile] = React.useState<File | null>();
  const ref = React.useRef<HTMLInputElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
    setFileError('');
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileErrorRemove = useCallback(() => {
    setFileError('');
    handleFileErrorRemove?.();
  }, []);

  const onFileRemove = useCallback(() => {
    setFile(null);
    if (ref.current) {
      ref.current.value = '';
    }
  }, []);

  const handleMaxFileSize = useCallback(
    (selectedFile: File) => {
      if (maxFileSize && selectedFile.size > maxFileSize) {
        throw new Error(
          'File size is too large. Max allowed is ' +
            (maxFileSizeText || maxFileSize + ' bytes') +
            '.',
        );
      }
    },
    [maxFileSize, maxFileSizeText],
  );

  const handleFileUpload = useCallback(
    async (selectedFile: File | undefined) => {
      if (!selectedFile) {
        // noop: No action if the file is not selected
        return;
      }

      try {
        handleMaxFileSize(selectedFile);
        handleErrorBeforeSelection?.(selectedFile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setFileError(err.message);
        onFileRemove();
        handleFileErrorRemove?.();
        return;
      }

      setFileError('');
      setFile(selectedFile);

      try {
        await handleFile?.(selectedFile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setFileError(err.message);
        return;
      }
    },
    [handleErrorBeforeSelection, handleFile, handleMaxFileSize, onFileRemove],
  );

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();

    setDragOver(false);

    const selectedFile = e?.dataTransfer?.files[0];

    handleFileUpload(selectedFile);
  };

  const onFileSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e?.target?.files?.[0];

      handleFileUpload(selectedFile);
    },
    [handleFileUpload],
  );

  return (
    <div className='container'>
      <form className='relative'>
        <div className='absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'>
          <Spinner show={loading} />
        </div>
        <label
          htmlFor={`file-${id}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`p-4 border-dashed border-4 border-bcBluePrimary flex flex-col gap-2 items-center justify-center cursor-pointer ${
            dragOver || loading ? 'opacity-20 disabled' : ''
          }`}
        >
          <FontAwesomeIcon icon={faCloudUploadAlt} className='h-8 text-bcBluePrimary' />
          {file && (
            <div className='flex flex-row gap-2 items-center w-full justify-center'>
              <h1 className='text-bcBluePrimary'>{file.name}</h1>
              <FontAwesomeIcon
                icon={faTimes}
                className='text-bcRedError cursor-pointer w-4 h-4'
                onClick={e => {
                  e.preventDefault();
                  onFileRemove();
                  onFileErrorRemove();
                }}
              />
            </div>
          )}
          {!file && maxFileSize && `Max file size: ${maxFileSizeText || maxFileSize + ' bytes'}`}
        </label>
        <input
          ref={ref}
          type='file'
          name={`file-${id}`}
          id={`file-${id}`}
          className='invisible h-0 w-0 absolute'
          accept={accept}
          onChange={onFileSelectChange}
        />
        {fileError && (
          <Alert type='error' className='mt-4'>
            {fileError}
          </Alert>
        )}
      </form>
    </div>
  );
};
