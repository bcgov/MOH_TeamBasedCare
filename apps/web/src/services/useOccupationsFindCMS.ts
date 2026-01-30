/**
 * Occupations Find CMS Hook
 *
 * Fetches paginated list of occupations for the Content Management System.
 * Supports search, sorting, and pagination with automatic data refresh
 * when parameters change.
 *
 * @example
 * const {
 *   occupations,
 *   pageIndex,
 *   total,
 *   onSearchTextChange,
 *   onSortChange,
 *   onPageOptionsChange,
 *   isLoading
 * } = useOccupationsFindCMS();
 *
 * @returns Object containing occupation list, pagination state, and handlers
 */

import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { PageOptions } from 'src/components/Pagination';
import {
  PaginationRO,
  SortOrder,
  OccupationCMSRO,
  OccupationsCMSFindSortKeys,
} from '@tbcm/common';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 1;

export const useOccupationsFindCMS = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState<OccupationCMSRO[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<OccupationsCMSFindSortKeys>(OccupationsCMSFindSortKeys.UPDATED_AT);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
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

  // Allowed Sort Orders - ASC / DESC; Default = ASC
  const nextSortOrder = useCallback((order?: SortOrder) => {
    switch (order) {
      case SortOrder.ASC:
        return SortOrder.DESC;
      default:
        return SortOrder.ASC;
    }
  }, []);

  const onSortChange = ({ key }: { key: OccupationsCMSFindSortKeys }) => {
    if (key === sortKey) {
      const updatedSortOrder = nextSortOrder(sortOrder);
      setSortOrder(updatedSortOrder);
    } else {
      setSortKey(key);
      setSortOrder(SortOrder.DESC);
    }

    resetPageIndex();
  };

  const onSearchTextChange = (text: string) => {
    setSearchText(text);
    resetPageIndex();
  };

  const onRefreshList = useCallback(() => {
    const config = {
      endpoint: API_ENDPOINT.findOccupationsCMS({
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
      }),
    };

    fetchData(config, (data: PaginationRO<OccupationCMSRO>) => {
      setOccupations(data.result);
      setTotal(data.total);
    });
  }, [fetchData, pageIndex, pageSize, sortKey, sortOrder, searchText]);

  useEffect(() => {
    onRefreshList();
  }, [onRefreshList]);

  return {
    occupations,
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
    onRefreshList,
  };
};
