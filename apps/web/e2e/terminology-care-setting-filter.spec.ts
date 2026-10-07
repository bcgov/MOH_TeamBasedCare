import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedAuth, stubApi, trackPageErrors, expectNoRuntimeOverlay } from './fixtures';

const FILTER = '#terminology-care-setting-filter';
const names = (page: Page) => page.locator('tbody tr td:first-child');

const chooseCareSetting = async (page: Page, option: string) => {
  await page.locator(FILTER).click();
  await page.getByRole('option', { name: option, exact: true }).click();
};

test.describe('care terminologies care setting filter', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
  });

  test('narrows the terminology list to the selected care setting', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/care-terminologies');

    const filter = page.locator(FILTER);
    await expect(filter).toBeEnabled();
    await expect(filter).toHaveAccessibleName('Care Setting: All care settings');
    await expect(names(page)).toHaveText(['Take vital signs', 'Record intake', 'Triage patients']);

    await page.locator(FILTER).click();
    // sorted by label, with the master suffix stripped
    await expect(page.getByRole('option')).toHaveText([
      'All care settings',
      'Acute Care',
      'Emergency Department',
      'Medical Unit',
    ]);
    await page.keyboard.press('Escape');

    await chooseCareSetting(page, 'Emergency Department');
    await expect(filter).toHaveAccessibleName('Care Setting: Emergency Department');
    await expect(names(page)).toHaveText(['Take vital signs', 'Triage patients']);

    await chooseCareSetting(page, 'Medical Unit');
    await expect(names(page)).toHaveText(['Take vital signs', 'Record intake']);

    await chooseCareSetting(page, 'All care settings');
    await expect(names(page)).toHaveCount(3);

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('sends the selected template id to the API and keeps the search applied', async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/care-activity/find')) requests.push(request.url());
    });

    await page.goto('/care-terminologies');
    await expect(page.locator(FILTER)).toBeEnabled();

    await chooseCareSetting(page, 'Medical Unit');
    await expect(names(page)).toHaveCount(2);
    expect(requests.at(-1)).toContain('careSetting=tpl-medical');

    await page.getByPlaceholder('Search').fill('Record');
    await expect(names(page)).toHaveText(['Record intake']);
    // the filter must survive a search rather than being reset by it
    expect(requests.at(-1)).toContain('careSetting=tpl-medical');
    await expect(page.locator(FILTER)).toHaveAccessibleName('Care Setting: Medical Unit');
  });

  test('the care setting filter has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/care-terminologies');
    await expect(page.locator(FILTER)).toBeEnabled();

    expect(
      (
        await new AxeBuilder({ page })
          .include(FILTER)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});
