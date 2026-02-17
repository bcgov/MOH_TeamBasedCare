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

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_INDEX = 1;

export const useActivitiesAllowedByOccupation = (occupationId?: string) => {
  const { fetchData, isLoading } = useHttp();
  const [allowedActivities, setAllowedActivities] = useState<AllowedActivityByOccupation[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<OccupationalScopeOfPracticeSortKeys>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();
  const [searchText, setSearchText] = useState('');
  const [filterByPermission, setFilterByPermission] = useState<Permissions>();
  const [selectedBundleId, setSelectedBundleId] = useState('');

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

    // reset to first page
    resetPageIndex();
  };

  const onSearchTextChange = ({ text }: { text: string }) => {
    setSearchText(text);

    // reset to first page
    resetPageIndex();
  };

  const onFilterByPermissionChange = ({ value }: { value?: Permissions }) => {
    setFilterByPermission(value);

    // reset to first page
    resetPageIndex();
  };

  const onBundleChange = (bundleId: string) => {
    setSelectedBundleId(bundleId);

    // reset to first page
    resetPageIndex();
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
        bundleId: selectedBundleId || undefined,
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
    selectedBundleId,
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
    selectedBundleId,
    onBundleChange,
    isLoading,
  };
};
