/**
 * Care Settings List Hook
 *
 * Provides paginated, searchable, sortable list of care setting templates.
 * Used by the care settings list page to display all templates.
 *
 * Features:
 * - Pagination with configurable page size
 * - Search by template name
 * - Sortable columns (name, parent, date modified)
 * - Auto-refresh when filters change
 *
 * @returns Object with care settings data, pagination state, and handlers
 */
import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { PageOptions } from 'src/components/Pagination';
import {
  PaginationRO,
  SortOrder,
  CareSettingTemplateRO,
  CareSettingsCMSFindSortKeys,
} from '@tbcm/common';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 1;

export const useCareSettingsFind = () => {
  const { fetchData, isLoading } = useHttp();
  const [careSettings, setCareSettings] = useState<CareSettingTemplateRO[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<CareSettingsCMSFindSortKeys>();
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

  const nextSortOrder = useCallback((order?: SortOrder) => {
    switch (order) {
      case SortOrder.ASC:
        return SortOrder.DESC;
      default:
        return SortOrder.ASC;
    }
  }, []);

  const onSortChange = ({ key }: { key: CareSettingsCMSFindSortKeys }) => {
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
      endpoint: API_ENDPOINT.findCareSettings({
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
      }),
    };

    fetchData(config, (data: PaginationRO<CareSettingTemplateRO>) => {
      setCareSettings(data.result);
      setTotal(data.total);
    });
  }, [fetchData, pageIndex, pageSize, sortKey, sortOrder, searchText]);

  useEffect(() => {
    onRefreshList();
  }, [onRefreshList]);

  return {
    careSettings,
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
