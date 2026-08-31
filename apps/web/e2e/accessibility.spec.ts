import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedAuth, stubApi } from './fixtures';

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

const scanTable = (page: Page) => new AxeBuilder({ page }).include(TABLE).withTags(WCAG).analyze();

test.describe('planning sessions table accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await page.goto('/planning');
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
