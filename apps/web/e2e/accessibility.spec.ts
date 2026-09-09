import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedAuth, stubApi, stubCareSettings } from './fixtures';

/**
 * Automated WCAG 2.1 A/AA checks for the planning sessions table (T066).
 *
 * The Pa11y harness in `packages/accessibility` targets a different application
 * and is not wired into CI, so these axe scans provide the accessibility
 * coverage for this feature instead.
 *
 * Scans are scoped to this feature's own UI. The surrounding page carries
 * pre-existing violations that predate this work (a focusable `aria-hidden`
 * wizard toolbar in `PlanningWrapper`, an unlabelled sidebar toggle, an
 * unlabelled care-setting `select`); scanning the whole document would mean
 * these tests fail for reasons unrelated to the sessions table.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const TABLE = 'table[aria-label="Your saved planning drafts"]';
const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';

const scanTable = (page: Page) => new AxeBuilder({ page }).include(TABLE).withTags(WCAG).analyze();

test.describe('planning sessions table accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await page.goto('/planning');
    await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
    await expect(page.getByText('Emergency Department Plan')).toBeVisible();
  });

  test('the sessions table has no WCAG A/AA violations', async ({ page }) => {
    const results = await scanTable(page);

    expect(results.violations).toEqual([]);
  });

  test('the plan title Rename control has no WCAG A/AA violations', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue Emergency Department Plan' }).click();
    await page.getByRole('button', { name: 'Rename' }).click();
    await expect(page.getByRole('dialog', { name: 'Rename' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(WCAG)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('the discard confirmation dialog has no WCAG A/AA violations', async ({ page }) => {
    await page.getByRole('button', { name: 'Discard Emergency Department Plan' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(WCAG)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('every column sort control has a distinct accessible name', async ({ page }) => {
    // WCAG 4.1.2: the sort controls are icon-only, so they need an explicit label.
    const labels = await page
      .locator(`${TABLE} th button`)
      .evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));

    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('each row action is distinguishable by its accessible name', async ({ page }) => {
    // WCAG 2.4.4: repeating a bare "Continue"/"Discard" name on every row leaves
    // screen reader users unable to tell the buttons apart.
    const labels = await page
      .getByRole('button', { name: /^(Continue|Discard) / })
      .evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));

    expect(labels.length).toBeGreaterThan(1);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

/**
 * Automated WCAG 2.1 A/AA checks for template levels, its four dialogs, and the
 * "Changes made by HA" badge.
 *
 * Scoped the same way as the planning scans above: the surrounding page carries
 * pre-existing violations that predate this work, so scanning the whole
 * document would fail for unrelated reasons.
 */
test.describe('template levels accessibility', () => {
  const scanDialog = (page: Page) =>
    new AxeBuilder({ page }).include('[role="dialog"]').withTags(WCAG).analyze();

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await stubCareSettings(page);
  });

  test('the level filter and Level column have no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/care-settings');
    await expect(page.getByRole('columnheader', { name: /Level/ })).toBeVisible();

    // Covers the whole table, Delete links included: their red used to fall
    // below the 4.5:1 contrast minimum and was darkened as part of this work.
    const results = await new AxeBuilder({ page })
      .include('#template-level-filter')
      .include('table')
      .withTags(WCAG)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('the Edit Details dialog has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Edit Details' }).click();
    await expect(page.getByRole('heading', { name: /Details$/ })).toBeVisible();

    expect((await scanDialog(page)).violations).toEqual([]);
  });

  test('the first-save details dialog has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/care-settings/copy?sourceId=tpl-ha');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Care Setting Details' })).toBeVisible();

    expect((await scanDialog(page)).violations).toEqual([]);
  });

  test('the Limits and Conditions dialog has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
    await page.locator('select').first().selectOption('LC');
    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();

    expect((await scanDialog(page)).violations).toEqual([]);
  });

  test('the save conflict dialog has no WCAG A/AA violations', async ({ page }) => {
    const stub = await stubCareSettings(page);
    stub.nextConflict = { currentVersion: 7, updatedBy: 'Jane Doe' };

    await page.goto('/care-settings/tpl-site/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Template changed by someone else' }),
    ).toBeVisible();

    expect((await scanDialog(page)).violations).toEqual([]);
  });

  test('the Changes made by HA badge is a real button with an accessible name', async ({
    page,
  }) => {
    // WCAG 4.1.2: the badge opens a dialog, so it has to be operable by
    // keyboard and exposed as a control rather than styled text.
    await page.goto('/care-settings/tpl-ha/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();

    const badges = page.getByRole('button', { name: 'Changes made by HA' });
    await expect(badges.first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('div.overflow-x-auto')
      .withTags(WCAG)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
