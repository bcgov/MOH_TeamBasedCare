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

    // The parent (the master) has no entry for this pair, so it differs: the HA
    // badge presents that comparison and nothing else.
    const haBadge = target.getByRole('button', { name: 'Changes made by HA' });
    await haBadge.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Changes made by HA — Not permitted → Limits and conditions',
    );

    // Reopening the dialog belongs to the LC badge, which every LC cell carries.
    await target.getByRole('button', { name: /^Limits and conditions for/ }).click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();
    await expect(page.locator('#limits-conditions-list')).toHaveText(STUB_LIMITS[1].name);
    await expect(page.locator('#restriction-description')).toHaveValue('Nights only');
  });

  /**
   * Reopening the dialog used to hang off the "Changes made by HA" badge, so it
   * was reachable only while the cell differed from the baseline. The two are
   * now separate: the LC badge is on every LC cell, the HA badge on every
   * differing cell, and either can appear without the other.
   */
  test('an LC cell matching the provincial master can still be reopened', async ({ page }) => {
    const inheritedLc = {
      activityId: 'activity-2',
      occupationId: 'occ-1',
      permission: 'LC' as const,
      limitId: 'limit-2',
      limitName: STUB_LIMITS[1].name,
      restrictionDescription: 'Nights only',
    };

    // The LC originates at provincial and is carried down untouched, so the
    // site matches the baseline and nothing is badged.
    stub.permissions['tpl-master'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      inheritedLc,
    ];
    stub.permissions['tpl-ha'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      inheritedLc,
    ];
    stub.permissions['tpl-site'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      inheritedLc,
    ];

    await openFinalizeStep(page, 'tpl-site');

    const target = cell(page, 'Vital signs', 'Registered Nurse');
    await expect(target.locator('select')).toHaveValue('LC');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

    await target.getByRole('button', { name: /^Limits and conditions for/ }).click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();
    await expect(page.locator('#restriction-description')).toHaveValue('Nights only');
  });

  test('an LC cell with no baseline to differ from can still be reopened', async ({ page }) => {
    // A copy of the provincial master is its own baseline, so no cell ever
    // differs and the HA badge never appears anywhere on the step.
    stub.permissions['tpl-master'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      {
        activityId: 'activity-2',
        occupationId: 'occ-1',
        permission: 'LC',
        limitId: 'limit-2',
        limitName: STUB_LIMITS[1].name,
        restrictionDescription: 'Nights only',
      },
    ];

    await openCopyFinalizeStep(page, 'tpl-master');

    const target = cell(page, 'Vital signs', 'Registered Nurse');
    await expect(target.locator('select')).toHaveValue('LC');
    await expect(page.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

    await target.getByRole('button', { name: /^Limits and conditions for/ }).click();

    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toBeVisible();
    await expect(page.locator('#restriction-description')).toHaveValue('Nights only');
  });

  test('the LC badge appears and disappears with the permission, not the comparison', async ({
    page,
  }) => {
    await openFinalizeStep(page, 'tpl-ha');

    // Y matching the parent: neither badge.
    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await expect(target.getByRole('button', { name: /^Limits and conditions for/ })).toHaveCount(0);
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

    // N differs from the parent but is not LC: the HA badge alone.
    await target.locator('select').selectOption('N');
    await expect(target.getByRole('button', { name: /^Limits and conditions for/ })).toHaveCount(0);
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();

    // LC differs and is LC: both, each doing its own job.
    await target.locator('select').selectOption('LC');
    await page.locator('#limits-conditions-list').click();
    await page.getByRole('option', { name: STUB_LIMITS[0].name, exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Limits and Conditions' })).toHaveCount(0);

    await expect(target.getByRole('button', { name: /^Limits and conditions for/ })).toBeVisible();
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();

    await expectNoRuntimeOverlay(page);
  });

  test('a badge on a non-LC cell shows a read-only comparison instead (UI case 17a)', async ({
    page,
  }) => {
    await openFinalizeStep(page, 'tpl-ha');

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await target.locator('select').selectOption('N');

    await target.getByRole('button', { name: 'Changes made by HA' }).hover();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Changes made by HA — Permitted → Not permitted');
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
    expect(saved.restrictionDescription).toBeNull();
  });

  /**
   * A copy joins its source's chain, so it shares the source's provincial
   * master and is measured against that. Comparing a copy against the source it
   * came from would mark nothing, hiding the health authority's existing
   * departures from provincial.
   */
  const openCopyFinalizeStep = async (page: any, sourceId: string) => {
    await page.goto(`/care-settings/copy?sourceId=${sourceId}`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Assessment' }).click();
  };

  test('a copy keeps the badge on an LC the source set over the provincial value', async ({
    page,
  }) => {
    await openCopyFinalizeStep(page, 'tpl-ha');

    // tpl-ha turned this cell into LC; the provincial master has no entry for it.
    const overridden = cell(page, 'Vital signs', 'Registered Nurse');
    await expect(overridden.locator('select')).toHaveValue('LC');

    const badge = overridden.getByRole('button', { name: 'Changes made by HA' });
    await badge.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Changes made by HA — Not permitted → Limits and conditions',
    );

    // A value the source left as the provincial one is not an override.
    await expect(
      cell(page, 'Initial assessment', 'Registered Nurse').getByRole('button', {
        name: 'Changes made by HA',
      }),
    ).toHaveCount(0);

    await expectNoRuntimeOverlay(page);
  });

  /**
   * The baseline is provincial at every level, so a site is measured two steps
   * up rather than against the health authority directly above it. Without the
   * walk this cell would match its parent exactly and show nothing, hiding an
   * override the site has inherited and is subject to.
   */
  test('a site is measured against provincial, not against its health authority', async ({
    page,
  }) => {
    // tpl-ha turned this cell into LC over a provincial value of N, and the
    // site inherited that LC verbatim.
    stub.permissions['tpl-site'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      {
        activityId: 'activity-2',
        occupationId: 'occ-1',
        permission: 'LC',
        limitId: 'limit-2',
        limitName: STUB_LIMITS[1].name,
        restrictionDescription: 'Nights only',
      },
    ];

    await openFinalizeStep(page, 'tpl-site');

    const inherited = cell(page, 'Vital signs', 'Registered Nurse');
    const badge = inherited.getByRole('button', { name: 'Changes made by HA' });
    await badge.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Changes made by HA — Not permitted → Limits and conditions',
    );
  });

  /**
   * The copy screen and the saved template now read the same baseline, so the
   * badges an administrator sees while copying are the ones that remain after
   * saving. They used to be measured against different templates.
   */
  test('a copy shows the same badges once it is saved', async ({ page }) => {
    await openCopyFinalizeStep(page, 'tpl-ha');

    const whileCopying = cell(page, 'Vital signs', 'Registered Nurse');
    await expect(whileCopying.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();

    // tpl-site is that copy once saved: same chain, same inherited LC.
    stub.permissions['tpl-site'] = [
      { activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' },
      {
        activityId: 'activity-2',
        occupationId: 'occ-1',
        permission: 'LC',
        limitId: 'limit-2',
        limitName: STUB_LIMITS[1].name,
        restrictionDescription: 'Nights only',
      },
    ];

    await openFinalizeStep(page, 'tpl-site');

    await expect(
      cell(page, 'Vital signs', 'Registered Nurse').getByRole('button', {
        name: 'Changes made by HA',
      }),
    ).toBeVisible();
  });

  test('copying the provincial master marks only what the user changes', async ({ page }) => {
    await openCopyFinalizeStep(page, 'tpl-master');

    const target = cell(page, 'Initial assessment', 'Registered Nurse');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

    await target.locator('select').selectOption('N');
    await expect(target.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();
  });

  test('each badge names the cell it belongs to', async ({ page }) => {
    await openFinalizeStep(page);

    // Two overridden cells, so there is more than one badge to tell apart.
    await cell(page, 'Initial assessment', 'Registered Nurse').locator('select').selectOption('N');
    await cell(page, 'Vital signs', 'Registered Nurse').locator('select').selectOption('Y');

    // Without a per-cell name every badge in the grid announces the same two
    // words, leaving a screen reader user no way to tell them apart.
    const names = await page
      .getByRole('button', { name: /^Changes made by HA for / })
      .evaluateAll((nodes: Element[]) => nodes.map(n => n.getAttribute('aria-label')));

    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('Changes made by HA for Registered Nurse \u2014 Initial assessment');

    expect(names).toContain('Changes made by HA for Registered Nurse \u2014 Vital signs');
  });

  for (const mode of ['edit', 'copy'] as const) {
    const openBaselineStep = async (page: any) => {
      if (mode === 'edit') await openFinalizeStep(page, 'tpl-ha');
      else await openCopyFinalizeStep(page, 'tpl-ha');
    };

    test(`${mode}: an existing empty provincial master badges Y and LC, but not N`, async ({
      page,
    }) => {
      stub.permissions['tpl-master'] = [];
      await openBaselineStep(page);

      const permitted = cell(page, 'Initial assessment', 'Registered Nurse');
      await expect(permitted.locator('select')).toHaveValue('Y');
      await permitted.getByRole('button', { name: 'Changes made by HA' }).hover();
      await expect(page.getByRole('tooltip')).toHaveText(
        'Changes made by HA — Not permitted → Permitted',
      );

      const limited = cell(page, 'Vital signs', 'Registered Nurse');
      await expect(limited.locator('select')).toHaveValue('LC');
      await expect(limited.getByRole('button', { name: 'Changes made by HA' })).toBeVisible();
      const notPermitted = cell(page, 'Initial assessment', 'Licensed Practical Nurse');
      await expect(notPermitted.locator('select')).toHaveValue('N');
      await expect(notPermitted.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);

      await permitted.locator('select').selectOption('N');
      await expect(permitted.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(0);
      await expectNoRuntimeOverlay(page);
    });

    test(`${mode}: a chain with no provincial master shows no badges or failure notice`, async ({
      page,
    }) => {
      const source = stub.templates.find(template => template.id === 'tpl-ha')!;
      source.parentId = null;
      source.parentName = null;
      await openBaselineStep(page);

      await expect(
        cell(page, 'Initial assessment', 'Registered Nurse').locator('select'),
      ).toHaveValue('Y');
      await expect(cell(page, 'Vital signs', 'Registered Nurse').locator('select')).toHaveValue(
        'LC',
      );
      await expect(page.getByRole('button', { name: /^Changes made by HA/ })).toHaveCount(0);
      await expect(
        page.getByRole('status').filter({ hasText: 'Comparison with the provincial standard' }),
      ).toHaveCount(0);
    });

    test(`${mode}: a failed baseline says so instead of silently dropping the labels`, async ({
      page,
    }) => {
      await page.route('**/care-settings/tpl-ha/master-permissions', route =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
      );
      await openBaselineStep(page);

      await expect(
        page.getByRole('status').filter({ hasText: 'Comparison with the provincial standard' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /^Changes made by HA/ })).toHaveCount(0);
    });

    for (const emptyMaster of [false, true]) {
      test(`${mode}: loading a ${emptyMaster ? 'empty' : 'nonempty'} baseline does not flash badges`, async ({
        page,
      }) => {
        if (emptyMaster) stub.permissions['tpl-master'] = [];
        let release = () => {};
        const held = new Promise<void>(resolve => {
          release = resolve;
        });
        await page.route('**/care-settings/tpl-ha/master-permissions', async route => {
          await held;
          await route.fallback();
        });

        await openBaselineStep(page);
        const permitted = cell(page, 'Initial assessment', 'Registered Nurse');
        await expect(permitted.locator('select')).toHaveValue('Y');
        await expect(page.getByRole('button', { name: /^Changes made by HA/ })).toHaveCount(0);

        release();
        await expect(
          cell(page, 'Vital signs', 'Registered Nurse').getByRole('button', {
            name: 'Changes made by HA',
          }),
        ).toBeVisible();
        await expect(permitted.getByRole('button', { name: 'Changes made by HA' })).toHaveCount(
          emptyMaster ? 1 : 0,
        );
      });
    }
  }
});
