import { act, renderHook } from '@testing-library/react';
import { CareSettingsCMSFindSortKeys, SortOrder, TemplateLevelFilter } from '@tbcm/common';
import { useCareSettingsFind } from 'src/services/useCareSettingsFind';

const mockFetchData = jest.fn();

jest.mock('src/services/useHttp', () => ({
  useHttp: () => ({ fetchData: mockFetchData, isLoading: false }),
}));

const lastQuery = () =>
  new URL(
    mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1][0].endpoint,
    'http://localhost',
  ).searchParams;

describe('care settings unit filter state', () => {
  beforeEach(() => mockFetchData.mockReset());

  it('starts with all units and omits the unit query parameter', () => {
    const { result } = renderHook(() => useCareSettingsFind());

    expect(result.current.unitId).toBe('');
    expect(lastQuery().has('unitId')).toBe(false);
  });

  it('resets the page on selection and clearing while preserving the other options', () => {
    const { result } = renderHook(() => useCareSettingsFind());

    act(() => {
      result.current.onSearchTextChange('medical');
      result.current.onLevelChange(TemplateLevelFilter.SITE);
      result.current.onSortChange({ key: CareSettingsCMSFindSortKeys.NAME });
      result.current.onPageOptionsChange({ pageIndex: 1, pageSize: 5, total: 30 });
    });
    act(() => result.current.onPageOptionsChange({ pageIndex: 3, pageSize: 5, total: 30 }));
    expect(result.current.pageIndex).toBe(3);

    act(() => result.current.onUnitChange('unit-1'));

    expect(Object.fromEntries(lastQuery())).toEqual({
      page: '1',
      pageSize: '5',
      searchText: 'medical',
      level: TemplateLevelFilter.SITE,
      sortBy: CareSettingsCMSFindSortKeys.NAME,
      sortOrder: SortOrder.DESC,
      unitId: 'unit-1',
    });
    expect(result.current.unitId).toBe('unit-1');
    expect(result.current.searchText).toBe('medical');
    expect(result.current.level).toBe(TemplateLevelFilter.SITE);

    act(() => result.current.onPageOptionsChange({ pageIndex: 2, pageSize: 5, total: 10 }));
    act(() => result.current.onUnitChange(''));

    expect(result.current.pageIndex).toBe(1);
    expect(lastQuery().has('unitId')).toBe(false);
    expect(lastQuery().get('searchText')).toBe('medical');
    expect(lastQuery().get('level')).toBe(TemplateLevelFilter.SITE);
    expect(lastQuery().get('sortBy')).toBe(CareSettingsCMSFindSortKeys.NAME);
    expect(lastQuery().get('sortOrder')).toBe(SortOrder.DESC);
  });

  it('retains the unit when search, level, sorting, pagination or refresh changes', () => {
    const { result } = renderHook(() => useCareSettingsFind());

    act(() => result.current.onUnitChange('unit-1'));
    act(() => result.current.onSearchTextChange('medical'));
    act(() => result.current.onLevelChange(TemplateLevelFilter.PROVINCIAL));
    act(() => result.current.onSortChange({ key: CareSettingsCMSFindSortKeys.NAME }));
    act(() => result.current.onPageOptionsChange({ pageIndex: 2, pageSize: 10, total: 30 }));
    act(() => result.current.onRefreshList());

    expect(lastQuery().get('unitId')).toBe('unit-1');
    expect(lastQuery().get('page')).toBe('2');
  });
});
