import { test, expect } from '@playwright/test';
import {
  seedAuth,
  stubApi,
  stubCareSettings,
  trackPageErrors,
  expectNoRuntimeOverlay,
  CareSettingsStub,
  STUB_LIMITS,
} from './fixtures';

/**
 * Real-browser coverage for limits and conditions — UI cases 10-13, 17, 17a.
 *
 * The dialog is opened by a side effect of changing a `<select>`, and
 * cancelling has to put that `<select>` back. jsdom will happily let a stale
 * value through, so this is exercised against a real DOM.
 */
test.describe('limits and conditions', () => {
  let stub: CareSettingsStub;

  const openFinalizeStep = async (page: any, templateId = 'tpl-site') => {
    await page.goto(`/care-settings/${templateId}/edit`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
  };

  /** The permission dropdown for one activity/occupation cell. */
  const cell = (page: any, activity: string, occupation: string) =>
    page
      .locator('div.border-t', { has: page.getByRole('heading', { name: activity }) })
      .locator('div.flex.flex-col', { has: page.getByText(occupation, { exact: true }) });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    stub = await stubCareSettings(page);
  });

  test('the limits catalogue is requested once when the finalize step opens', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/care-settings/cms/limits-conditions')) {
        requests.push(request.url());
      }
    });

    await openFinalizeStep(page);
    await expect(page.getByRole('heading', { name: 'Assessment' })).toBeVisible();

    expect(requests).toHaveLength(1);
  });

  test('choosing LC opens the dialog, and Save stays disabled until a limit is picked (UI cases 10-11)', async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openFinalizeStep(page);

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await target.locator('select').selectOption('LC');

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();

    const save = page.getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();

    const limitsList = page.locator('#limits-conditions-list');
    await expect(limitsList).toHaveText(/List of Limits and conditions/);

    await limitsList.click();
    await page.getByRole('option', { name: STUB_LIMITS[1].name, exact: true }).click();
    await expect(save).toBeEnabled();

    // A second choice replaces the first rather than accumulating.
    await limitsList.click();
    await page.getByRole('option', { name: STUB_LIMITS[0].name, exact: true }).click();
    await expect(limitsList).toHaveText(STUB_LIMITS[0].name);

    await page.locator('#restriction-description').fill('Only with a second nurse present.');
    await save.click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toHaveCount(0);
    await expect(target.locator('select')).toHaveValue('LC');

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('cancelling the dialog reverts the cell to its previous permission (UI case 12)', async ({
    page,
  }) => {
    await openFinalizeStep(page);

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await expect(target.locator('select')).toHaveValue('Y');

    await target.locator('select').selectOption('LC');
    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toHaveCount(0);
    await expect(target.locator('select')).toHaveValue('Y');
  });

  test('dismissing with the close icon also reverts the cell (UI case 12)', async ({ page }) => {
    await openFinalizeStep(page);

    const target = cell(page, 'Initial assessment', 'Licensed Practical Nurse');
    await expect(target.locator('select')).toHaveValue('N');

    await target.locator('select').selectOption('LC');
    await page.getByRole('button', { name: 'Close Limits and Conditions' }).click();

    await expect(target.locator('select')).toHaveValue('N');
  });

  test('reopening a saved LC cell shows its stored values (UI cases 13, 17)', async ({ page }) => {
    // tpl-ha carries an LC permission with a limit and description already set.
    await openFinalizeStep(page, 'tpl-ha');

    const target = cell(page, 'Vital signs', 'Registered Nurse');
    await expect(target.locator('select')).toHaveValue('LC');

    // The parent (the master) has no entry for this pair, so it differs and the
    // badge presents the comparison on hover and is the way back into the dialog on click.
    const badge = target.getByRole('button', { name: 'Changes made by HA' });
    await badge.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Changes made by HA — Parent: Not permitted → This template: Limits and conditions',
    );

    await badge.click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();
    await expect(page.locator('#limits-conditions-list')).toHaveText(STUB_LIMITS[1].name);
    await expect(page.locator('#restriction-description')).toHaveValue('Nights only');
  });

  test('a badge on a non-LC cell shows a read-only comparison instead (UI case 17a)', async ({
    page,
  }) => {
    await openFinalizeStep(page, 'tpl-ha');

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await target.locator('select').selectOption('N');

    await target.getByRole('button', { name: 'Changes made by HA' }).hover();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText(
      'Changes made by HA — Parent: Perform → This template: Not permitted',
    );
    await expect(tooltip).toHaveCSS('background-color', 'rgb(56, 89, 138)');
    await expect(tooltip.locator('span')).toHaveCSS('white-space', 'normal');
    expect(
      await tooltip.locator('span').evaluate(element => element.scrollWidth <= element.clientWidth),
    ).toBe(true);

    // The limits dialog is never opened for a non-LC cell.
    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toHaveCount(0);
  });

  test('the badge disappears when a cell is set back to the parent value', async ({ page }) => {
    await openFinalizeStep(page, 'tpl-ha');

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

    await target.locator('select').selectOption('N');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();

    await target.locator('select').selectOption('Y');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);
  });

  test('moving a cell away from LC drops its limit from the saved payload (UI case 14)', async ({
    page,
  }) => {
    await openFinalizeStep(page, 'tpl-ha');

    await cell(page, 'Vital signs', 'Registered Nurse').locator('select').selectOption('Y');

    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page).toHaveURL(/\/care-settings$/);
    const saved = stub.saves[0].body.changes.permissionUpserts.find(
      (p: any) => p.activityId === 'activity-2' && p.occupationId === 'occ-1',
    );
    expect(saved).toMatchObject({ permission: 'Y' });
    expect(saved.limitId).toBeUndefined();
    expect(saved.restrictionDescription).toBeUndefined();
  });
});
