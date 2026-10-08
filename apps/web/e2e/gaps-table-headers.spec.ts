import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedAuth, stubApi, GAP_ACTIVITY_COLUMN, STUB_PLANNING_OCCUPATIONS } from './fixtures';

/**
 * Column headers of the gaps, optimizations and suggestions grid.
 *
 * The occupation columns open a description dialog, but the click handler sat on
 * the `<th>` itself: no role, no tab stop, and nothing announced, so the dialog
 * was mouse-only (WCAG 2.1.1 / 4.1.2). The competency column carried the same
 * `cursor-pointer` while doing nothing at all.
 */

const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';
const DRAFT = 'Emergency Department Plan';
const [RN] = STUB_PLANNING_OCCUPATIONS;

test.describe('gaps table column headers', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);

    await page.goto('/planning');
    await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
    await page.getByRole('button', { name: `Continue ${DRAFT}` }).click();

    const next = page.getByRole('button', { name: 'Next', exact: true });
    await expect(page.getByText('Assessment')).toBeVisible();
    await next.click();
    await expect(page.getByText('1 / 2 Selected')).toBeVisible();
    await next.click();

    await expect(page.getByRole('columnheader', { name: RN.name })).toBeVisible();
  });

  test('every column is announced, including the competency column', async ({ page }) => {
    await expect(page.locator('.activity-gap-table thead th')).toHaveText([
      GAP_ACTIVITY_COLUMN,
      ...STUB_PLANNING_OCCUPATIONS.map(occupation => occupation.name),
    ]);

    // scoped headers are what tie each permission cell back to its occupation
    const scopes = await page
      .locator('.activity-gap-table thead th')
      .evaluateAll(nodes => nodes.map(node => node.getAttribute('scope')));
    expect(scopes.every(scope => scope === 'col')).toBe(true);

    // the competency column opens nothing, so it must not look or act clickable
    await expect(
      page.getByRole('columnheader', { name: GAP_ACTIVITY_COLUMN }).getByRole('button'),
    ).toHaveCount(0);
  });

  test('an occupation description opens from the keyboard', async ({ page }) => {
    const header = page.getByRole('button', { name: `View ${RN.name} description` });

    await header.focus();
    await expect(header).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(RN.name);
    await expect(dialog).toContainText(RN.description);
  });

  test('the grid header has no WCAG A/AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('.activity-gap-table thead')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
