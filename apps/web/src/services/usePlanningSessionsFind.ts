import { useCallback, useEffect, useState } from 'react';
import {
  PaginationRO,
  PlanningSessionSummaryRO,
  PlanningSessionsFindSortKeys,
  SortOrder,
} from '@tbcm/common';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { PageOptions } from 'src/components/Pagination';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 1;

export const usePlanningSessionsFind = () => {
  const { fetchData, isLoading } = useHttp();
  const [sessions, setSessions] = useState<PlanningSessionSummaryRO[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<PlanningSessionsFindSortKeys>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [searchText, setSearchText] = useState('');

  // Bumped by mutations so the listing refreshes without a page reload, keeping
  // the active search term, sort order and page position (FR-035, FR-047).
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refreshSessions = useCallback(() => {
    setRefreshCounter(count => count + 1);
  }, []);

  const onPageOptionsChange = ({ pageIndex: pgIndex, pageSize: size }: PageOptions) => {
    if (size !== pageSize) {
      setPageSize(size);
      setPageIndex(DEFAULT_PAGE_INDEX);
    } else {
      setPageIndex(pgIndex);
    }
  };

  const resetPageIndex = useCallback(() => {
    setPageIndex(DEFAULT_PAGE_INDEX);
  }, []);

  const nextSortOrder = useCallback((order?: SortOrder) => {
    switch (order) {
      case SortOrder.ASC:
        return SortOrder.DESC;
      case SortOrder.DESC:
        return undefined;
      default:
        return SortOrder.ASC;
    }
  }, []);

  const onSortChange = ({ key }: { key: PlanningSessionsFindSortKeys }) => {
    if (key === sortKey) {
      const updatedSortOrder = nextSortOrder(sortOrder);
      if (updatedSortOrder === undefined) {
        setSortKey(undefined);
      }
      setSortOrder(updatedSortOrder);
    } else {
      setSortKey(key);
      setSortOrder(SortOrder.ASC);
    }

    resetPageIndex();
  };

  const onSearchTextChange = ({ text }: { text: string }) => {
    setSearchText(text);

    resetPageIndex();
  };

  const clearSearch = useCallback(() => {
    setSearchText('');
    setPageIndex(DEFAULT_PAGE_INDEX);
  }, []);

  useEffect(() => {
    const config = {
      endpoint: API_ENDPOINT.findPlanningSessions({
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
      }),
    };

    fetchData(config, (data: PaginationRO<PlanningSessionSummaryRO>) => {
      setSessions(data.result);
      setTotal(data.total);
    });
  }, [fetchData, pageIndex, pageSize, sortKey, sortOrder, searchText, refreshCounter]);

  return {
    sessions,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    searchText,
    onSearchTextChange,
    clearSearch,
    refreshSessions,
    isLoading,
  };
};
