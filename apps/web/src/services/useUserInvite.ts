import { CreateUserInviteDTO } from '@tbcm/common';
import { useState } from 'react';
import { useHttp } from './useHttp';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { toast } from 'react-toastify';

export const useUserInvite = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const [initialValues] = useState<CreateUserInviteDTO>({
    email: '',
    roles: [],
  });

  const handleSubmit = (values: CreateUserInviteDTO, cb?: () => void) => {
    const config = {
      endpoint: API_ENDPOINT.inviteUser,
      method: REQUEST_METHOD.POST,
      data: values,
    };

    sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info(`User invitation successful.`);
      },
      () => void 0,
      'User invitation failed',
    );
  };

  return { handleSubmit, initialValues, isLoading };
};
