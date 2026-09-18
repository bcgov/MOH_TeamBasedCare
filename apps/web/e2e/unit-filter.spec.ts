import { test, expect, Page } from '@playwright/test';
import {
  buildTemplates,
  seedAuth,
  stubApi,
  stubCareSettings,
  STUB_UNITS,
  trackPageErrors,
  expectNoRuntimeOverlay,
} from './fixtures';

const [medical, emergency] = STUB_UNITS;
const buildMultiUnitTemplates = () => [
  ...buildTemplates(),
  ...buildTemplates().map(template => ({
    ...template,
    id: `${template.id}-emergency`,
    name: template.name.replace('Medical Unit', emergency.displayName),
    unitId: emergency.id,
    unitName: emergency.displayName,
    parentId: template.parentId ? `${template.parentId}-emergency` : null,
    parentName: template.parentName?.replace('Medical Unit', emergency.displayName) ?? null,
  })),
];

const chooseFilter = async (page: Page, selector: string, option: string) => {
  await page.locator(selector).click();
  await page.getByRole('option', { name: option, exact: true }).click();
};

const expectUnitOptions = async (page: Page) => {
  await page.locator('#template-unit-filter').click();
  await expect(page.getByRole('option')).toHaveText([
    'All units',
    'Emergency Department',
    'Medical Unit',
  ]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).not.toBeVisible();
};

test.describe('care settings unit filter', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await stubCareSettings(page, buildMultiUnitTemplates());
  });

  test('combines unit, level and search, and clears only the unit', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/care-settings');
    const unit = page.locator('#template-unit-filter');
    const level = page.locator('#template-level-filter');
    const search = page.getByPlaceholder('Search by care setting name');
    const names = page.locator('tbody tr td:first-child');

    await expect(names).toHaveCount(6);
    await expect(unit).toHaveAccessibleName('Unit: All units');
    await expectUnitOptions(page);

    await chooseFilter(page, '#template-unit-filter', emergency.displayName);
    await expect(names).toHaveText([
      'Provincial Emergency Department',
      'Island Health Emergency Department',
      'Victoria General Emergency Department',
    ]);
    await chooseFilter(page, '#template-level-filter', 'Site / Care Settings');
    await expect(names).toHaveText(['Victoria General Emergency Department']);
    const searchedRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return (
        url.pathname.endsWith('/care-settings/cms/find') &&
        url.searchParams.get('searchText') === 'Victoria'
      );
    });
    await search.fill('Victoria');
    await searchedRequest;
    await expect(names).toHaveText(['Victoria General Emergency Department']);

    await chooseFilter(page, '#template-unit-filter', medical.displayName);
    await expect(names).toHaveText(['Victoria General Medical Unit']);
    await expect(level).toHaveAccessibleName('Template level: Site / Care Settings');
    await expect(search).toHaveValue('Victoria');

    const clearedRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith('/care-settings/cms/find') && !url.searchParams.has('unitId');
    });
    await chooseFilter(page, '#template-unit-filter', 'All units');
    const url = new URL((await clearedRequest).url());
    expect(url.searchParams.get('searchText')).toBe('Victoria');
    expect(url.searchParams.get('level')).toBe('site');
    await expect(names).toHaveText([
      'Victoria General Medical Unit',
      'Victoria General Emergency Department',
    ]);

    await chooseFilter(page, '#template-unit-filter', emergency.displayName);
    await search.fill('Medical');
    await expect(page.getByText('No care settings found')).toBeVisible();
    await expectUnitOptions(page);
    await expect(unit).toHaveAccessibleName('Unit: Emergency Department');
    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('resets pagination, retains sorting and uses the filtered total', async ({ page }) => {
    const templates = buildMultiUnitTemplates();
    await stubCareSettings(page, [
      ...templates,
      ...Array.from({ length: 11 }, (_, index) => ({
        ...templates[2],
        id: `extra-medical-${index}`,
        name: `Additional Medical Unit ${index}`,
      })),
    ]);
    await page.goto('/care-settings');
    await expect(page.getByText('1 - 10 of 17 items')).toBeVisible();
    await page.getByRole('button', { name: 'Sort by Care Setting Name' }).click();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11 - 17 of 17 items')).toBeVisible();
    await expectUnitOptions(page);

    const filteredRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return (
        url.pathname.endsWith('/care-settings/cms/find') &&
        url.searchParams.get('unitId') === emergency.id
      );
    });
    await chooseFilter(page, '#template-unit-filter', emergency.displayName);
    const query = new URL((await filteredRequest).url()).searchParams;
    expect(query.get('page')).toBe('1');
    expect(query.get('sortBy')).toBe('name');
    expect(query.get('sortOrder')).toBe('DESC');
    await expect(page.getByText('1 - 3 of 3 items')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();

    await chooseFilter(page, '#template-unit-filter', 'All units');
    await expect(page.getByText('1 - 10 of 17 items')).toBeVisible();
    await expectUnitOptions(page);
  });

  test('supports keyboard selection and dismissal with dashboard-style filter icons', async ({
    page,
  }) => {
    await page.goto('/care-settings');
    const unit = page.getByRole('button', { name: 'Unit: All units' });
    await expect(unit).toBeEnabled();
    await expect(unit.locator('[data-icon="filter"]')).toBeVisible();
    await expect(page.locator('#template-level-filter [data-icon="filter"]')).toBeVisible();
    await unit.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const selectedUnit = page.getByRole('button', { name: 'Unit: Emergency Department' });
    await expect(selectedUnit).toBeFocused();
    await expect(page.locator('tbody tr td:first-child')).toHaveText([
      'Provincial Emergency Department',
      'Island Health Emergency Department',
      'Victoria General Emergency Department',
    ]);
    await selectedUnit.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(selectedUnit).toBeFocused();
  });
});
