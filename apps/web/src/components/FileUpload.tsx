import { faCloudUploadAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';
import { Alert } from './Alert';

interface FileUploadProps {
  id: string;
  accept?: string;
  maxFileSize?: number; // in bytes
  maxFileSizeText?: string;
  handleErrorBeforeSelection?: (selectedFile: File) => void;
  handleFile: (selectedFile: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  accept,
  maxFileSize = 25000000,
  maxFileSizeText = '25 MB',
  handleErrorBeforeSelection,
  handleFile,
}) => {
  const [file, setFile] = React.useState<File | null>();
  const ref = React.useRef<HTMLInputElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileDropError, setFileDropError] = useState('');

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
    setFileDropError('');
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileRemove = useCallback((e?: React.MouseEvent<SVGSVGElement>) => {
    e?.preventDefault();
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
    (selectedFile: File | undefined) => {
      if (!selectedFile) {
        setFileDropError('Failed to select file');
        return;
      }

      try {
        handleMaxFileSize(selectedFile);
        handleErrorBeforeSelection?.(selectedFile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setFileDropError(err.message);
        onFileRemove();
        return;
      }

      setFileDropError('');
      setFile(selectedFile);

      handleFile?.(selectedFile);
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
        <label
          htmlFor={`file-${id}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`p-4 border-dashed border-4 border-bcBluePrimary flex flex-col gap-2 items-center justify-center ${
            dragOver ? 'opacity-50' : ''
          }`}
        >
          <FontAwesomeIcon icon={faCloudUploadAlt} className='h-8 text-bcBluePrimary' />
          {file && (
            <div className='flex flex-row gap-2 items-center'>
              <h1 className='text-bcBluePrimary'>{file.name}</h1>
              <FontAwesomeIcon
                icon={faTimes}
                className='px-4 h-4 text-bcRedError cursor-pointer'
                onClick={onFileRemove}
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
        {fileDropError && (
          <Alert type='error' className='mt-4'>
            {fileDropError}
          </Alert>
        )}
      </form>
    </div>
  );
};
