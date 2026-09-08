import { test, expect } from '@playwright/test';
import {
  seedAuth,
  stubApi,
  stubCareSettings,
  trackPageErrors,
  expectNoRuntimeOverlay,
  CareSettingsStub,
} from './fixtures';

/**
 * Real-browser coverage for template levels — UI cases 2, 9a-9c, and the
 * Edit Details round trip.
 *
 * These need a real browser rather than jsdom: the filter, the search box, and
 * the table share one query, and the level dialog is chained behind another
 * dialog, so the behaviour under test is the sequencing of real network calls
 * rather than any single component's render.
 */
test.describe('template levels', () => {
  let stub: CareSettingsStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    stub = await stubCareSettings(page);
  });

  test('the level filter narrows the table and composes with search (UI case 2)', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto('/care-settings');

    // Scoped to the first column: the Parent column repeats these same names,
    // so an unscoped match would find a filtered-out template's parent.
    const names = page.locator('tbody tr td:first-child');

    await expect(names).toHaveText([
      'Provincial Medical Unit',
      'Island Health Medical Unit',
      'Victoria General Medical Unit',
    ]);

    await page.locator('#template-level-filter').selectOption('health authority');
    await expect(names).toHaveText(['Island Health Medical Unit']);

    // The search text is deliberately untouched by a filter change, so the two
    // narrow the list together rather than resetting each other.
    await page.getByPlaceholder('Search by care setting name').fill('Victoria');
    await expect(page.getByText('No care settings found')).toBeVisible();

    await page.locator('#template-level-filter').selectOption('site');
    await expect(names).toHaveText(['Victoria General Medical Unit']);

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('the table shows a Level column for every tier (UI case 1)', async ({ page }) => {
    await page.goto('/care-settings');

    await expect(page.getByRole('columnheader', { name: /Level/ })).toBeVisible();
    await expect(page.locator('tbody tr td:nth-child(2)')).toHaveText([
      'Provincial',
      'Health Authority',
      'Site / Care Settings',
    ]);
  });

  test('first save asks for a name and a level, with Save disabled until both are set (UI case 9a)', async ({
    page,
  }) => {
    await page.goto('/care-settings/copy?sourceId=tpl-ha');

    // The unsaved copy is titled after its parent.
    await expect(
      page.getByRole('heading', { name: 'Island Health Medical Unit Copy' }),
    ).toBeVisible();
    await expect(page.getByText(/Template level:/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Care Setting Details' })).toBeVisible();

    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await expect(saveButton).toBeDisabled();

    await page.locator('#edit-details-name').fill('Nanaimo Medical Unit');
    await expect(saveButton).toBeDisabled();

    await page.getByRole('radio', { name: /Site \/ Care Setting Template/ }).check();
    await expect(saveButton).toBeEnabled();

    await saveButton.click();

    await expect(page).toHaveURL(/\/care-settings$/);
    expect(stub.copies).toHaveLength(1);
    expect(stub.copies[0].body.level).toBe('site');
    expect(stub.copies[0].body.name).toBe('Nanaimo Medical Unit');
  });

  test('a copy starts with its parent permissions in the finalize step', async ({ page }) => {
    await page.goto('/care-settings/copy?sourceId=tpl-ha');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();

    await expect(page.locator('#permission-activity-1-occ-1')).toHaveValue('Y');
    await expect(page.locator('#permission-activity-2-occ-1')).toHaveValue('LC');
    await expect(page.locator('#permission-activity-1-occ-2')).toHaveValue('N');
  });

  test('cancelling the details prompt abandons the save and creates nothing (UI case 9b)', async ({
    page,
  }) => {
    await page.goto('/care-settings/copy?sourceId=tpl-ha');

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.locator('#edit-details-name').fill('Nanaimo Medical Unit');

    await expect(page.getByRole('heading', { name: 'Care Setting Details' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Care Setting Details' })).toHaveCount(0);
    // Still in the wizard, with the work intact.
    await expect(page).toHaveURL(/\/care-settings\/copy/);
    expect(stub.copies).toHaveLength(0);
  });

  test('the details prompt does not reappear when saving an existing template (UI case 9c)', async ({
    page,
  }) => {
    await page.goto('/care-settings/tpl-site/edit');

    await expect(
      page.getByRole('heading', { name: 'Victoria General Medical Unit' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Care Setting Details' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/care-settings$/);
    expect(stub.saves).toHaveLength(1);
  });

  test('the details card names the parent and the level once saved', async ({ page }) => {
    await page.goto('/care-settings/tpl-site/edit');

    await expect(page.getByText('Edited from:')).toBeVisible();
    await expect(page.getByText('Island Health Medical Unit')).toBeVisible();
    await expect(page.getByText('Template level:')).toBeVisible();
    await expect(page.getByText('Site / Care Settings')).toBeVisible();
  });

  test('Edit Details renames the template and changes its level', async ({ page }) => {
    await page.goto('/care-settings/tpl-site/edit');

    await page.getByRole('button', { name: 'Edit Details' }).click();
    await expect(
      page.getByRole('heading', { name: 'Victoria General Medical Unit Details' }),
    ).toBeVisible();

    await page.locator('#edit-details-name').fill('Victoria General — Ward 4');
    await page.getByRole('radio', { name: /Health Authority Template/ }).check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    expect(stub.detailSaves).toHaveLength(1);
    expect(stub.detailSaves[0].body).toMatchObject({
      name: 'Victoria General — Ward 4',
      level: 'health authority',
      expectedVersion: 1,
    });

    await expect(page.getByRole('heading', { name: 'Victoria General — Ward 4' })).toBeVisible();
    await expect(page.getByText('Health Authority')).toBeVisible();
  });
});
