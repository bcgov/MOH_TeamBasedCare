import useSWR from 'swr';
import { Role, UserRO } from '@tbcm/common';
import { useCallback } from 'react';
import { AxiosPublic } from 'src/utils';
import { API_ENDPOINT } from 'src/common';

export const useMe = () => {
  const { data: me, ...response } = useSWR<UserRO>(
    API_ENDPOINT.AUTH_USER,
    (url: string) => AxiosPublic(url).then(res => res.data),
    {
      revalidateOnFocus: true,
    },
  );

  const hasUserRole = useCallback(
    (roles: Role[]) => {
      if (!Array.isArray(roles) || !Array.isArray(me?.roles)) return false;

      return me?.roles.some(role => roles.includes(role));
    },
    [me],
  );

  return { me, hasUserRole, ...response };
};
