import { useState } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { UserRO, EditUserDTO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useUserEdit = (user: UserRO) => {
  const { sendApiRequest, isLoading } = useHttp();

  const [initialValues] = useState<EditUserDTO>({
    roles: user.roles || [],
  });

  const handleSubmit = (values: EditUserDTO, cb?: () => void) => {
    const config = {
      endpoint: API_ENDPOINT.EDIT_USER(user.id),
      method: REQUEST_METHOD.POST,
      data: values,
    };

    sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info(`User update successful.`);
      },
      () => void 0,
      'User update failed',
    );
  };

  return { handleSubmit, initialValues, isLoading };
};
