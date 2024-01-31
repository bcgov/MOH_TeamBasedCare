import { API_ENDPOINT } from 'src/common';
import { useHttp } from './useHttp';
import { UserGuide } from '@tbcm/common';
import { useCallback } from 'react';
import _ from 'lodash';

export const useUserGuide = () => {
  const { fetchData, isLoading } = useHttp();

  /** fetch user guide files */
  const fetchFiles = useCallback(
    (cb: (files: UserGuide[]) => void, errorToastMessage?: string) => {
      const config = {
        endpoint: `${API_ENDPOINT.USER_GUIDE_FILES}`,
      };

      fetchData(
        config,
        (data: UserGuide[]) => {
          if (data) {
            cb(_.orderBy(data, 'lastModified', 'desc'));
          }
        },
        errorToastMessage,
      );
    },
    [fetchData],
  );

  /** fetch signed url */
  const fetchSignedUrl = useCallback(
    (
      name: string,
      cb: (data: { url: string }) => void,
      errorToastMessage?: string,
      version?: string,
    ) => {
      const query = version ? new URLSearchParams({ version }).toString() : '';

      const config = {
        endpoint: `${API_ENDPOINT.USER_GUIDE_SIGNED_URL(name)}?${query}`,
      };

      fetchData(config, cb, errorToastMessage);
    },
    [fetchData],
  );

  return {
    isLoading,
    fetchFiles,
    fetchSignedUrl,
  };
};
