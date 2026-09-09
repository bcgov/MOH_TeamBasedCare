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
 * Real-browser coverage for the save conflict flow — UI cases 18-21.
 *
 * Both branches out of this dialog destroy something, so each one is exercised
 * end to end rather than inferred from the component in isolation.
 */
test.describe('save conflict', () => {
  let stub: CareSettingsStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    stub = await stubCareSettings(page);
  });

  const saveWizard = async (page: any) => {
    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
  };

  test('a 409 opens the conflict dialog rather than a generic error (UI case 18)', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    stub.nextConflict = {
      currentVersion: 7,
      updatedBy: 'Jane Doe',
      updatedAt: '2026-02-01T09:00:00.000Z',
    };

    await saveWizard(page);

    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toBeVisible();
    await expect(page.getByText(/Jane Doe saved changes to this template/)).toBeVisible();
    await expect(page.getByText(/Nothing has been saved yet/)).toBeVisible();

    // Still on the wizard, and nothing was written.
    await expect(page).toHaveURL(/\/care-settings\/tpl-site\/edit/);
    expect(stub.saves).toHaveLength(0);

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('Override re-submits carrying the currentVersion from the 409 (UI case 20)', async ({
    page,
  }) => {
    stub.nextConflict = { currentVersion: 7, updatedBy: 'Jane Doe' };

    await saveWizard(page);
    await page.getByRole('button', { name: 'Override' }).click();

    await expect(page).toHaveURL(/\/care-settings$/);
    expect(stub.saves).toHaveLength(1);
    expect(stub.saves[0].body.expectedVersion).toBe(7);
  });

  test('Reload discards the unsaved work and returns to the wizard (UI case 19)', async ({
    page,
  }) => {
    stub.nextConflict = { currentVersion: 7 };

    await saveWizard(page);
    await page.getByRole('button', { name: 'Reload' }).click();

    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/care-settings\/tpl-site\/edit/);
    expect(stub.saves).toHaveLength(0);
  });

  test('a second conflict re-opens the dialog rather than forcing the write through', async ({
    page,
  }) => {
    stub.nextConflict = { currentVersion: 7 };

    await saveWizard(page);

    // The stub clears its conflict after firing, so arm it again for the retry.
    stub.nextConflict = { currentVersion: 9, updatedBy: 'Sam Lee' };
    await page.getByRole('button', { name: 'Override' }).click();

    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toBeVisible();
    await expect(page.getByText(/Sam Lee saved changes to this template/)).toBeVisible();
    expect(stub.saves).toHaveLength(0);
  });

  test('the first save sends the version loaded with the template', async ({ page }) => {
    await saveWizard(page);

    await expect(page).toHaveURL(/\/care-settings$/);
    expect(stub.saves[0].body.expectedVersion).toBe(1);
  });

  test('a details save conflict opens the same dialog', async ({ page }) => {
    stub.nextConflict = { currentVersion: 4, updatedBy: 'Jane Doe' };

    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Edit Details' }).click();
    await page.locator('#edit-details-name').fill('Victoria General — Ward 4');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toBeVisible();
    expect(stub.detailSaves).toHaveLength(0);
  });

  // Override used to be a no-op after a details conflict, because only full
  // wizard saves recorded what the user had attempted.
  test('Override after a details conflict resends the details against the newer version', async ({
    page,
  }) => {
    stub.nextConflict = { currentVersion: 4, updatedBy: 'Jane Doe' };

    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Edit Details' }).click();
    await page.locator('#edit-details-name').fill('Victoria General — Ward 4');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: 'Override' }).click();

    await expect.poll(() => stub.detailSaves.length).toBe(1);
    expect(stub.detailSaves[0].body.expectedVersion).toBe(4);
    expect(stub.detailSaves[0].body.name).toBe('Victoria General — Ward 4');
    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toHaveCount(0);
  });
});
