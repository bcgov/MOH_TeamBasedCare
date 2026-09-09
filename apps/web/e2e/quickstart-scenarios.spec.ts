import { test, expect, Page } from '@playwright/test';
import { seedAuth, stubApi, expectNoRuntimeOverlay, ApiStub } from './fixtures';

/**
 * Browser walkthrough of the quickstart verification scenarios that are
 * observable from the UI. Ownership enforcement (SC-005) and the junction-row
 * cleanup in SC-007 are server-side and covered by the API specs instead.
 */

const ROW_ONE = 'Emergency Department Plan';
const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';

async function openTable(page: Page) {
  await page.goto('/planning');
  await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
  await expect(page.getByText(ROW_ONE)).toBeVisible();
}

async function openRenameDialog(page: Page, name: string) {
  await page.getByRole('button', { name: `Continue ${name}` }).click();
  await page.getByRole('button', { name: 'Rename' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rename' });
  await expect(dialog).toBeVisible();
  return dialog.getByRole('button', { name: 'Save' });
}

/** The Rename dialog's Name field. */
function renameDialogInput(page: Page) {
  return page.getByRole('dialog', { name: 'Rename' }).getByRole('textbox', { name: 'Name' });
}

test.describe('quickstart scenarios', () => {
  let stub: ApiStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    stub = await stubApi(page);
  });

  test('SC-004: renaming from the plan title updates the draft', async ({ page }) => {
    await openTable(page);
    const save = await openRenameDialog(page, ROW_ONE);

    await renameDialogInput(page).fill('Renamed Care Plan');
    await save.click();

    await expect(page.getByText('Renamed Care Plan')).toBeVisible();
    expect(stub.renames.at(-1)?.name).toBe('Renamed Care Plan');
    await expectNoRuntimeOverlay(page);
  });

  test('SC-004: cancelling the Rename dialog restores the original name', async ({ page }) => {
    await openTable(page);
    await openRenameDialog(page, ROW_ONE);

    await renameDialogInput(page).fill('Something Entirely Different');
    await page
      .getByRole('dialog', { name: 'Rename' })
      .getByRole('button', { name: 'Cancel' })
      .click();

    await expect(page.getByText(ROW_ONE)).toBeVisible();
    expect(stub.renames).toEqual([]);
  });

  test('SC-004: clicking Rename does not navigate away from Planning', async ({ page }) => {
    await openTable(page);
    await openRenameDialog(page, ROW_ONE);

    expect(new URL(page.url()).pathname).toBe('/planning');
  });

  test('SC-004: the plan title opens one rename dialog at a time', async ({ page }) => {
    await openTable(page);
    await openRenameDialog(page, ROW_ONE);
    await expect(page.getByRole('dialog', { name: 'Rename' })).toHaveCount(1);
    expect(stub.renames).toEqual([]);
  });

  test('FR-013: a name shorter than 10 characters is rejected', async ({ page }) => {
    await openTable(page);
    const save = await openRenameDialog(page, ROW_ONE);

    await renameDialogInput(page).fill('Care plan');
    await save.click();

    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
    // Dialog stays open and nothing was persisted.
    await expect(page.getByRole('dialog', { name: 'Rename' })).toBeVisible();
    expect(stub.renames).toEqual([]);
  });

  test('FR-013: length is measured after trimming', async ({ page }) => {
    await openTable(page);
    const save = await openRenameDialog(page, ROW_ONE);

    await renameDialogInput(page).fill('  Care pla  ');
    await save.click();

    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
    expect(stub.renames).toEqual([]);
  });

  test('FR-013: exactly 10 characters is accepted', async ({ page }) => {
    await openTable(page);
    const save = await openRenameDialog(page, ROW_ONE);

    await renameDialogInput(page).fill('Care plans');
    await save.click();

    await expect(page.getByText('Care plans')).toBeVisible();
    expect(stub.renames.at(-1)?.name).toBe('Care plans');
  });

  test('FR-014: a duplicate name is rejected', async ({ page }) => {
    await openTable(page);
    const save = await openRenameDialog(page, ROW_ONE);

    // Same as another session, differing only by case and padding.
    await renameDialogInput(page).fill('  intensive care unit plan  ');
    await save.click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Rename' })).toBeVisible();
  });

  test('SC-007: discard asks for confirmation and can be cancelled', async ({ page }) => {
    await openTable(page);

    await page.getByRole('button', { name: `Discard ${ROW_ONE}` }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Delete Draft Care Plan?');
    await expect(dialog).toContainText('This draft will be permanently deleted');

    await dialog.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByText(ROW_ONE)).toBeVisible();
    expect(stub.deleted).toEqual([]);
  });

  test('SC-007: confirming discard removes only that session', async ({ page }) => {
    await openTable(page);

    await page.getByRole('button', { name: `Discard ${ROW_ONE}` }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Delete Draft' }).click();

    // Scope to the table: the success toast also mentions the discarded name.
    const rows = page.locator('tbody');
    await expect(rows.getByText(ROW_ONE)).toBeHidden();
    await expect(rows.getByText('Intensive Care Unit Plan')).toBeVisible();
    expect(stub.deleted).toEqual(['11111111-1111-1111-1111-111111111111']);
  });

  test('SC-008: search filters the table by name', async ({ page }) => {
    await openTable(page);

    await page.getByRole('textbox', { name: /search/i }).fill('Intensive');

    const rows = page.locator('tbody');
    await expect(rows.getByText('Intensive Care Unit Plan')).toBeVisible();
    await expect(rows.getByText(ROW_ONE)).toBeHidden();
    await expectNoRuntimeOverlay(page);
  });

  test('SC-009: sorting by name reorders the whole set', async ({ page }) => {
    await openTable(page);

    const names = () => page.locator('tbody tr td:first-child').allInnerTexts();
    await page.getByRole('button', { name: 'Sort by Planning name' }).click();

    await expect.poll(async () => (await names())[0]).toContain('Ambulatory Care Plan');
    await expectNoRuntimeOverlay(page);
  });
});
