import { CareSettingsCMSFindSortKeys, SortOrder, TemplateLevelFilter } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common/request-method';

describe('care settings query parameters', () => {
  it('includes the unit alongside search, level, sorting and pagination', () => {
    const url = new URL(
      API_ENDPOINT.findCareSettings({
        unitId: '11111111-1111-4111-8111-111111111111',
        searchText: 'Acute & emergency',
        level: TemplateLevelFilter.SITE,
        sortKey: CareSettingsCMSFindSortKeys.NAME,
        sortOrder: SortOrder.ASC,
        pageIndex: 2,
        pageSize: 5,
      }),
      'http://localhost',
    );

    expect(Object.fromEntries(url.searchParams)).toEqual({
      unitId: '11111111-1111-4111-8111-111111111111',
      searchText: 'Acute & emergency',
      level: TemplateLevelFilter.SITE,
      sortBy: CareSettingsCMSFindSortKeys.NAME,
      sortOrder: SortOrder.ASC,
      page: '2',
      pageSize: '5',
    });
  });

  it.each([undefined, ''])('omits unitId for All units (%p)', unitId => {
    expect(API_ENDPOINT.findCareSettings({ unitId })).toBe('/care-settings/cms/find');
  });
});
