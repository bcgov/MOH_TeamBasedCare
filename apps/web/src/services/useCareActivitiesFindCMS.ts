import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { PageOptions } from 'src/components/Pagination';
import {
  PaginationRO,
  SortOrder,
  CareActivityCMSRO,
  CareActivitiesCMSFindSortKeys,
} from '@tbcm/common';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 1;

export const useCareActivitiesFindCMS = () => {
  const { fetchData, isLoading } = useHttp();
  const [careActivities, setCareActivities] = useState<CareActivityCMSRO[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<CareActivitiesCMSFindSortKeys>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [searchText, setSearchText] = useState('');

  const onPageOptionsChange = ({ pageIndex: pgIndex, pageSize: size }: PageOptions) => {
    if (size !== pageSize) {
      setPageSize(size);
      setPageIndex(1);
    } else {
      setPageIndex(pgIndex);
    }
  };

  const resetPageIndex = useCallback(() => {
    setPageIndex(DEFAULT_PAGE_INDEX);
  }, []);

  // Allowed Sort Orders for Care Activities - ASC / DESC; Default = ASC
  // No undefined SortOrder is allowed like in Occupational Scope
  const nextSortOrder = useCallback((order?: SortOrder) => {
    switch (order) {
      case SortOrder.ASC:
        return SortOrder.DESC;
      default:
        return SortOrder.ASC;
    }
  }, []);

  const onSortChange = ({ key }: { key: CareActivitiesCMSFindSortKeys }) => {
    if (key === sortKey) {
      const updatedSortOrder = nextSortOrder(sortOrder);
      setSortOrder(updatedSortOrder);
    } else {
      setSortKey(key);
      setSortOrder(SortOrder.DESC); // since the default sort order is already ASC, start with descending
    }

    // reset to first page
    resetPageIndex();
  };

  const onSearchTextChange = ({ text }: { text: string }) => {
    setSearchText(text);

    // reset to first page
    resetPageIndex();
  };

  useEffect(() => {
    const config = {
      endpoint: API_ENDPOINT.findCareActivitiesCMS({
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
      }),
    };

    fetchData(config, (data: PaginationRO<CareActivityCMSRO>) => {
      setCareActivities(data.result);
      setTotal(data.total);
    });
  }, [fetchData, pageIndex, pageSize, sortKey, sortOrder, searchText]);

  return {
    careActivities,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    searchText,
    onSearchTextChange,
    isLoading,
  };
};
