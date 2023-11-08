import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { AllowedActivityByOccupation } from '../common/interfaces';
import { PageOptions } from 'src/components/Pagination';
import {
  OccupationalScopeOfPracticeSortKeys,
  PaginationRO,
  Permissions,
  SortOrder,
} from '@tbcm/common';

const DEFAULT_PAGE_SIZE = 5;

export const useActivitiesAllowedByOccupation = (occupationId?: string) => {
  const { fetchData, isLoading } = useHttp();
  const [allowedActivities, setAllowedActivities] = useState<AllowedActivityByOccupation[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<OccupationalScopeOfPracticeSortKeys>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [searchText, setSearchText] = useState('');
  const [filterByPermission, setFilterByPermission] = useState<Permissions>();

  const onPageOptionsChange = ({ pageIndex: pgIndex, pageSize: size }: PageOptions) => {
    if (size !== pageSize) {
      setPageSize(size);
      setPageIndex(1);
    } else {
      setPageIndex(pgIndex);
    }
  };

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

  const onSortChange = ({ key }: { key: OccupationalScopeOfPracticeSortKeys }) => {
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

    // reset to default page
    setPageIndex(1);
  };

  const onSearchTextChange = ({ text }: { text: string }) => {
    setSearchText(text);
  };

  const onFilterByPermissionChange = ({ value }: { value?: Permissions }) => {
    setFilterByPermission(value);
  };

  useEffect(() => {
    if (!occupationId) return;

    const config = {
      endpoint: API_ENDPOINT.getActivitiesAllowedByOccupation(occupationId, {
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
        filterByPermission,
      }),
    };

    fetchData(config, (data: PaginationRO<AllowedActivityByOccupation>) => {
      setAllowedActivities(data.result);
      setTotal(data.total);
    });
  }, [
    fetchData,
    pageIndex,
    pageSize,
    sortKey,
    sortOrder,
    searchText,
    occupationId,
    filterByPermission,
  ]);

  return {
    allowedActivities,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    searchText,
    onSearchTextChange,
    filterByPermission,
    onFilterByPermissionChange,
    isLoading,
  };
};
