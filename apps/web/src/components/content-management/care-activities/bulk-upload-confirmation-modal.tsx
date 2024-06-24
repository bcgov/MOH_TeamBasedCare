import { useHttp } from '@services';
import { CareActivityBulkData } from '@tbcm/common';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { ModalWrapper } from 'src/components/Modal';

export interface ConfirmData {
  headers: string[];
  data: CareActivityBulkData[];
  fileName: string;
  careActivitiesCount: number;
}

interface BulkUploadConfirmationModalCMSProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  setUploadModal: Dispatch<SetStateAction<boolean>>;
  confirmData?: ConfirmData;
}

export const BulkUploadConfirmationModalCMS: React.FC<BulkUploadConfirmationModalCMSProps> = ({
  showModal,
  setShowModal,
  setUploadModal,
  confirmData,
}) => {
  const { sendApiRequest, isLoading } = useHttp();

  const onConfirmClick = () => {
    if (!confirmData) {
      return;
    }

    const config = {
      method: REQUEST_METHOD.POST,
      endpoint: API_ENDPOINT.CARE_ACTIVITY_CMS_BULK_UPLOAD,
      data: {
        headers: confirmData.headers,
        data: confirmData.data,
      },
    };

    sendApiRequest(
      config,
      async () => {
        setShowModal(false);
        setUploadModal(false);
        toast.success('Successfully uploaded');
      },
      () => {},
      'Failed to confirm the uploaded template',
    );
  };

  return (
    <ModalWrapper
      isOpen={showModal}
      setIsOpen={setShowModal}
      title='Bulk upload confirmation'
      closeButton={{ title: 'Back', isDisabled: isLoading }}
      actionButton={{ title: 'Confirm', onClick: onConfirmClick, isLoading }}
    >
      <div className='p-4'>
        <p>Are you sure you want to update the system with the items in your uploaded file?</p>

        <p className='pt-4'>
          <b>File Name:</b> {confirmData?.fileName}
        </p>

        <p className='pt-4'>
          <b>File summary:</b>
        </p>

        <ul className='ml-8 list-disc'>
          <li>{confirmData?.careActivitiesCount} care activities</li>
        </ul>
      </div>
    </ModalWrapper>
  );
};
