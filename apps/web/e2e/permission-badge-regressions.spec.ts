import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CareSettingsStub, seedAuth, STUB_LIMITS, stubApi, stubCareSettings } from './fixtures';
import { expectPermissionControlLayout } from './permission-control-assertions';

const openFinalize = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Assessment / }).click();
};

const lcBadge = (page: Page) =>
  page
    .locator('#permission-activity-2-occ-1')
    .locator('..')
    .getByRole('button', { name: 'View details', exact: true });

test.describe('permission badge regressions', () => {
  let stub: CareSettingsStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);
    stub = await stubCareSettings(page);
  });

  test('delayed direct-parent data never asserts a comparison before it arrives', async ({
    page,
  }) => {
    stub.permissions['tpl-site'] = structuredClone(stub.permissions['tpl-ha']);
    let release!: () => void;
    const pending = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.route('**/care-settings/tpl-site/parent-permissions', async route => {
      await pending;
      await route.fulfill({ json: stub.permissions['tpl-ha'] });
    });

    try {
      await openFinalize(page, '/care-settings/tpl-site/edit');
      const badge = lcBadge(page);
      await expect(page.getByRole('status')).toContainText('Loading parent permissions');
      await expect(badge).toHaveClass(/bg-gray-100/);
      await expect(page.getByRole('button', { name: 'Changes made', exact: true })).toHaveCount(0);
      await badge.hover();
      await expect(page.getByRole('tooltip')).toContainText('Parent comparison unavailable.');
      await expect(page.getByRole('tooltip')).not.toContainText('Change made:');
    } finally {
      release();
    }

    // The grandparent has no LC row: only the direct parent should matter.
    await expect(lcBadge(page)).toHaveClass(/bg-green-100/);
    await expect(page.getByText(/Loading parent permissions/)).toHaveCount(0);
  });

  test('a failed parent request keeps LC details available and can be retried', async ({
    page,
  }) => {
    stub.permissions['tpl-site'] = structuredClone(stub.permissions['tpl-ha']);
    let requests = 0;
    await page.route('**/care-settings/tpl-site/parent-permissions', route => {
      requests += 1;
      return requests === 1
        ? route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } })
        : route.fulfill({ json: stub.permissions['tpl-ha'] });
    });

    await openFinalize(page, '/care-settings/tpl-site/edit');
    const warning = page
      .getByRole('alert')
      .filter({ hasText: 'Parent permissions could not be loaded' });
    await expect(warning).toContainText('Changes cannot be compared.');
    const badge = lcBadge(page);
    await expect(badge).toHaveClass(/bg-gray-100/);
    await expect(badge).toHaveCSS('border-top-color', 'rgb(209, 213, 219)');
    await expect(badge).toHaveCSS('border-radius', '2px');
    await expectPermissionControlLayout(page);
    await badge.hover();
    await expect(page.getByRole('tooltip')).toContainText(`Selected LC: ${STUB_LIMITS[1].name}`);
    await expect(page.getByRole('tooltip')).not.toContainText('Change made:');
    await badge.click();
    await expect(page.locator('#limits-conditions-list')).toHaveText(STUB_LIMITS[1].name);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Retry parent permissions' }).click();

    await expect(badge).toHaveClass(/bg-green-100/);
    await expect(badge).toHaveCSS('border-top-color', 'rgb(134, 239, 172)');
    await expect(badge).toHaveCSS('border-radius', '2px');
    await expectPermissionControlLayout(page);
    await expect(warning).toHaveCount(0);
    expect(requests).toBe(2);
  });

  test('scope-enriched master copies use the same parent baseline before and after saving', async ({
    page,
  }) => {
    stub.copyPermissions['tpl-master'] = [
      ...stub.permissions['tpl-master'],
      {
        activityId: 'activity-2',
        occupationId: 'occ-1',
        permission: 'LC',
        limitId: null,
        limitName: null,
        restrictionDescription: null,
      },
    ];
    await openFinalize(page, '/care-settings/copy?sourceId=tpl-master');
    await expect(lcBadge(page)).toHaveClass(/bg-bcYellowPrimary\/50/);
    await lcBadge(page).hover();
    await expect(page.getByRole('tooltip')).toContainText(
      'Change made: Not permitted → Limits and conditions',
    );

    // Scope rows have no selected limit. Supply one before saving the new LC.
    await lcBadge(page).click();
    await page.locator('#limits-conditions-list').click();
    await page.getByRole('option', { name: STUB_LIMITS[1].name, exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(lcBadge(page)).toHaveClass(/bg-bcYellowPrimary\/50/);

    await page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await page.locator('#edit-details-name').fill('Scope-enriched copy');
    await page.getByRole('radio', { name: /Site \/ Care Setting Template/ }).check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/care-settings$/);

    await openFinalize(page, '/care-settings/tpl-copy-1/edit');
    await expect(page.locator('#permission-activity-2-occ-1')).toHaveValue('LC');
    await expect(lcBadge(page)).toHaveClass(/bg-bcYellowPrimary\/50/);
    await lcBadge(page).hover();
    await expect(page.getByRole('tooltip')).toContainText(
      'Change made: Not permitted → Limits and conditions',
    );
  });

  for (const flow of ['edit', 'copy'] as const) {
    test(`restriction-description overrides show the parent and new text in the ${flow} flow`, async ({
      page,
    }) => {
      stub.permissions['tpl-site'] = structuredClone(stub.permissions['tpl-ha']);
      await openFinalize(
        page,
        flow === 'edit' ? '/care-settings/tpl-site/edit' : '/care-settings/copy?sourceId=tpl-ha',
      );
      const badge = lcBadge(page);
      await expect(badge).toHaveClass(/bg-green-100/);

      await badge.click();
      await page.locator('#restriction-description').fill('Days only\nWith supervision');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(badge).toHaveClass(/bg-bcYellowPrimary\/50/);
      await badge.hover();
      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toContainText('Restriction description changed:');
      await expect(tooltip.getByText('From: Nights only', { exact: true })).toBeVisible();
      const updated = tooltip.getByText('To: Days only With supervision', { exact: true });
      await expect(updated).toBeVisible();
      await expect(updated).toHaveCSS('white-space', 'pre-wrap');

      await badge.click();
      await page.locator('#restriction-description').fill('');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await badge.hover();
      await expect(tooltip.getByText('From: Nights only', { exact: true })).toBeVisible();
      await expect(tooltip.getByText('To: None', { exact: true })).toBeVisible();

      await badge.click();
      await page.locator('#restriction-description').fill('Nights only');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(badge).toHaveClass(/bg-green-100/);
      await badge.hover();
      await expect(tooltip).not.toContainText('Restriction description changed:');
    });

    test(`inactive LC names survive viewing and changing the dialog in the ${flow} flow`, async ({
      page,
    }) => {
      const inactive = {
        activityId: 'activity-2',
        occupationId: 'occ-1',
        permission: 'LC' as const,
        limitId: 'inactive-certification',
        limitName: 'Retired certification',
        restrictionDescription: 'Still required for this activity',
      };
      stub.permissions['tpl-ha'] = [inactive];
      stub.permissions['tpl-site'] = [inactive];
      await openFinalize(
        page,
        flow === 'edit' ? '/care-settings/tpl-site/edit' : '/care-settings/copy?sourceId=tpl-ha',
      );
      const badge = lcBadge(page);
      await expect(badge).toHaveClass(/bg-green-100/);
      await badge.hover();
      await expect(page.getByRole('tooltip')).toContainText('Selected LC: Retired certification');
      await badge.click();
      await expect(page.locator('#limits-conditions-list')).toHaveText('Retired certification');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(badge).toHaveClass(/bg-green-100/);

      // Replacing an inactive choice must not retain its old display name.
      await badge.click();
      await page.locator('#limits-conditions-list').click();
      await page.getByRole('option', { name: STUB_LIMITS[0].name, exact: true }).click();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(badge).toHaveClass(/bg-bcYellowPrimary\/50/);
      await badge.hover();
      await expect(page.getByRole('tooltip')).toContainText(`Selected LC: ${STUB_LIMITS[0].name}`);
      await expect(page.getByRole('tooltip')).not.toContainText(
        'Selected LC: Retired certification',
      );
    });
  }

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 600 },
  ]) {
    test(`long LC details stay onscreen and are scrollable at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      // Include both line breaks and a long unbroken token.
      const restriction = `${'Long restriction line\n'.repeat(70)}${'X'.repeat(800)}`.slice(
        0,
        2000,
      );
      const lc = stub.permissions['tpl-ha'].find(p => p.permission === 'LC')!;
      lc.restrictionDescription = restriction;
      stub.permissions['tpl-site'] = structuredClone(stub.permissions['tpl-ha']);
      await openFinalize(page, '/care-settings/tpl-site/edit');
      const badge = lcBadge(page);
      await expect(badge).toHaveClass(/bg-green-100/);
      await badge.hover();
      const tooltip = page.getByRole('tooltip');
      const details = page.getByRole('region', { name: 'Permission details' });
      await expect(details).toBeVisible();
      await expect
        .poll(() =>
          tooltip.evaluate(element => {
            const rect = element.getBoundingClientRect();
            return (
              rect.top >= 7 &&
              rect.left >= 7 &&
              rect.bottom <= window.innerHeight - 7 &&
              rect.right <= window.innerWidth - 7
            );
          }),
        )
        .toBe(true);
      expect(await details.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(
        true,
      );
      expect(await details.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );

      await details.hover();
      await page.mouse.wheel(0, 300);
      await expect.poll(() => details.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await badge.focus();
      await badge.press('ArrowDown');
      await expect(details).toBeFocused();
      await details.press('Home');
      await expect.poll(() => details.evaluate(element => element.scrollTop)).toBe(0);
      await details.press('End');
      await expect
        .poll(() =>
          details.evaluate(
            element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
          ),
        )
        .toBe(true);

      const scan = await new AxeBuilder({ page })
        .include('[role="tooltip"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      await details.press('Escape');
      await expect(tooltip).toHaveCount(0);
      await expect(badge).toBeFocused();
    });
  }
});
