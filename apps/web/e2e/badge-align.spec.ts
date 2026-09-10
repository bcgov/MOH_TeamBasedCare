import { test, expect } from '@playwright/test';
import { seedAuth, stubApi, stubCareSettings } from './fixtures';

/**
 * The badge sits on top of the closed select, so a stray line box in its
 * wrapper pushes it off the select's vertical centre. Only a real layout
 * engine can show that, so it is measured here.
 */
test.describe('changed-by-HA badge alignment', () => {
  test('every badge is centred on its select', async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await stubCareSettings(page);

    await page.goto('/care-settings/tpl-ha/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
    await expect(page.locator('select').first()).toBeVisible();

    // A badge on an LC cell opens its edit dialog; on any other value it
    // triggers an explanatory tooltip, so both buttons have to be measured.
    await page.locator('select').nth(0).selectOption('LC');
    await page.locator('select').nth(1).selectOption('Y');

    const offsets = await page.evaluate(() => {
      const results: { value: string; offset: number }[] = [];

      document.querySelectorAll('select').forEach(select => {
        const cell = select.parentElement;
        const badge = Array.from(cell?.querySelectorAll('button') ?? []).find(
          button => button.textContent === 'Changes made by HA',
        );
        if (!badge) return;

        const s = select.getBoundingClientRect();
        const b = badge.getBoundingClientRect();
        results.push({
          value: select.value,
          offset: Math.round((b.y + b.height / 2 - (s.y + s.height / 2)) * 100) / 100,
        });
      });

      return results;
    });

    console.log(JSON.stringify(offsets));
    expect(offsets.length).toBeGreaterThan(1);
    for (const { value, offset } of offsets) {
      expect(Math.abs(offset), `badge on the ${value} select is off centre`).toBeLessThanOrEqual(
        0.5,
      );
    }
  });
});
