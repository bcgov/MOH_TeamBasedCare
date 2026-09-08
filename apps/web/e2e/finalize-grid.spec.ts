import { test, expect } from '@playwright/test';
import { seedAuth, stubApi, stubCareSettings } from './fixtures';

/**
 * The finalize grid used fixed column breakpoints while its cells carried a
 * minimum width, so between two breakpoints a cell was wider than its track and
 * the permission dropdowns overlapped. Column count now follows the measured
 * width, which only a real layout engine can verify.
 */
test.describe('finalize permission grid', () => {
  const widths = [1440, 1200, 1024, 900, 800, 700, 640, 500, 375];

  test('permission dropdowns never overlap as the page narrows', async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await stubCareSettings(page);

    await page.goto('/care-settings/tpl-ha/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
    await expect(page.locator('select').first()).toBeVisible();

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });

      const overlaps = await page.locator('select').evaluateAll((els: Element[]) => {
        const boxes = els.map(el => el.getBoundingClientRect());

        return boxes.filter((a, i) =>
          boxes.some(
            (b, j) =>
              j !== i && Math.abs(a.y - b.y) < 5 && a.x < b.right - 0.5 && b.x < a.right - 0.5,
          ),
        ).length;
      });

      expect(overlaps, `dropdowns overlap at ${width}px`).toBe(0);
    }
  });
});
