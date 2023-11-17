import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { OccupationItemProps } from '../common/interfaces';
import { PageOptions } from 'src/components/Pagination';
import { PaginationRO, OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_INDEX = 1;

export const useOccupationsFind = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState<OccupationItemProps[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(DEFAULT_PAGE_INDEX);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<OccupationsFindSortKeys>();
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
      case SortOrder.DESC:
        return undefined;
      default:
        return SortOrder.ASC;
    }
  }, []);

  const onSortChange = ({ key }: { key: OccupationsFindSortKeys }) => {
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

  useEffect(() => {
    const config = {
      endpoint: API_ENDPOINT.findOccupations({
        pageIndex,
        pageSize,
        sortKey,
        sortOrder,
        searchText,
      }),
    };

    fetchData(config, (data: PaginationRO<OccupationItemProps>) => {
      setOccupations(data.result);
      setTotal(data.total);
    });
  }, [fetchData, pageIndex, pageSize, sortKey, sortOrder, searchText]);

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
  };
};
