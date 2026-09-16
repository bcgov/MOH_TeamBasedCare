import { test, expect } from '@playwright/test';
import { seedAuth, STUB_LIMITS, stubApi, stubCareSettings } from './fixtures';
import { expectPermissionControlLayout } from './permission-control-assertions';

/**
 * The badge sits on top of the closed select, so a stray line box in its
 * wrapper pushes it off the select's vertical centre. Only a real layout
 * engine can show that, so it is measured here.
 */
test.describe('permission badge alignment', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    await stubCareSettings(page);
  });

  for (const path of ['/care-settings/tpl-ha/edit', '/care-settings/copy?sourceId=tpl-master']) {
    test(`value, caret, and badge stay aligned in ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Assessment' }).click();

      await page.locator('#permission-activity-1-occ-1').selectOption('N');
      await page.locator('#permission-activity-1-occ-2').selectOption('Y');
      const lcSelect = page.locator('#permission-activity-2-occ-1');
      if ((await lcSelect.inputValue()) !== 'LC') {
        await lcSelect.selectOption('LC');
        await page.locator('#limits-conditions-list').click();
        await page.getByRole('option', { name: STUB_LIMITS[0].name, exact: true }).click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);

      const controls = await expectPermissionControlLayout(page);
      expect(controls.filter(control => control.badge).map(control => control.value)).toEqual([
        'N',
        'Y',
        'LC',
      ]);
      expect(controls.filter(control => !control.badge)).toHaveLength(1);

      const badge = lcSelect.locator('..').getByRole('button', { name: 'View details' });
      await expect(badge).toHaveCSS('border-radius', '2px');
      await expect(badge).toHaveCSS('border-top-width', '1px');
      await expect(badge).toHaveCSS('border-top-color', 'rgb(252, 186, 25)');
      await expect(badge).toHaveCSS('background-color', 'rgba(252, 186, 25, 0.5)');
      await expect(badge).toHaveCSS('color', 'rgb(49, 49, 50)');
      await expect(badge).toHaveCSS('font-weight', '400');
    });
  }

  test('caret and field padding target the native select, not the badge', async ({
    page,
  }, testInfo) => {
    await page.route('**/care-settings/*/occupations', route =>
      route.fulfill({
        json: [{ id: 'occ-1', name: 'Physiotherapist', displayName: 'Physiotherapist' }],
      }),
    );
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/care-settings/tpl-ha/edit');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
    const select = page.locator('#permission-activity-2-occ-1');
    const cell = select.locator('..');
    const badge = cell.getByRole('button');
    await expect(badge).toHaveAccessibleName('View details');
    const caret = cell.locator('svg');
    await expectPermissionControlLayout(page);
    const screenshot = testInfo.outputPath('permission-control.png');
    await cell.locator('..').screenshot({ path: screenshot });
    await testInfo.attach('permission-control', {
      path: screenshot,
      contentType: 'image/png',
    });

    await select.scrollIntoViewIfNeeded();
    const hitTargets = await select.evaluate(element => {
      const arrow = element.parentElement?.querySelector('svg')?.getBoundingClientRect();
      if (!arrow) throw new Error('Missing permission caret');
      const field = element.getBoundingClientRect();
      return {
        caret:
          document.elementFromPoint(arrow.x + arrow.width / 2, arrow.y + arrow.height / 2) ===
          element,
        // This is inside the badge wrapper but above the button itself.
        fieldPadding: document.elementFromPoint(field.right - 12, field.top + 2) === element,
      };
    });
    expect(hitTargets).toEqual({ caret: true, fieldPadding: true });
    const arrow = await caret.boundingBox();
    if (!arrow) throw new Error('Permission caret is not visible');
    await page.mouse.click(arrow.x + arrow.width / 2, arrow.y + arrow.height / 2);
    await page.keyboard.press('Escape');
    await expect(select).toBeFocused();
    await expect(select).toHaveValue('LC');

    await select.press('Tab');
    await expect(badge).toBeFocused();
    await expect(badge).toHaveCSS('outline-style', 'solid');
    await expect(badge).toHaveCSS('outline-width', '2px');
    await expect(page.getByRole('tooltip')).toContainText('Limits and conditions');
    await badge.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(select).toHaveValue('LC');

    await select.focus();
    await select.press('Space');
    await page.keyboard.press('y');
    await page.keyboard.press('Enter');
    await expect(select).toHaveValue('Y');
    await badge.hover();
    await expect(badge).toHaveCSS('background-color', 'rgba(252, 186, 25, 0.6)');
    await expect(badge).toHaveAccessibleName('Changes made');
    await expect(page.getByRole('tooltip')).toContainText('Change made: Not permitted → Permitted');
    await badge.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
