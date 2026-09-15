import { test, expect } from '@playwright/test';
import {
  seedAuth,
  stubApi,
  ApiStub,
  expectNoRuntimeOverlay,
  STUB_PLANNING_SAVED_ACTIVITY,
} from './fixtures';

/**
 * Leaving the wizard saves the draft.
 *
 * A stage only wrote to the API when Next was pressed, so a planner who edited a stage
 * and then used the sidebar — to the care setting templates page, for example — lost the
 * edit. Driven in the browser because the loss depended on the real router transition
 * unmounting the wizard.
 */

const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';
const DRAFT = 'Emergency Department Plan';
const DRAFT_ID = '11111111-1111-1111-1111-111111111111';

test.describe('saving a draft on navigation', () => {
  let stub: ApiStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    stub = await stubApi(page);

    await page.goto('/planning');
    await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
    await page.getByRole('button', { name: `Continue ${DRAFT}` }).click();

    // Continue lands on the Care Competencies stage; pick a competency to list its activities.
    await page.getByText('Assessment').click();
    await expect(page.getByText('Take vital signs')).toBeVisible();
    // The draft's own selection has loaded, so the stage starts valid and a save that
    // should not happen would go through rather than being stopped by validation.
    await expect(page.getByRole('checkbox', { name: 'Record intake' })).toBeChecked();
  });

  test('an edit is saved when leaving for the care settings page', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Take vital signs' }).check();

    await page.locator('aside li[title="Care Settings"]').click();

    await expect(page).toHaveURL(/\/care-settings$/);
    await expect
      .poll(() => stub.careActivitySaves.map(save => save.body['bundle-1']?.slice().sort()))
      .toEqual([[STUB_PLANNING_SAVED_ACTIVITY, 'activity-1'].sort()]);
    expect(stub.careActivitySaves[0].id).toBe(DRAFT_ID);
    await expectNoRuntimeOverlay(page);
  });

  test('an edit survives a save that fails, and is written when leaving', async ({ page }) => {
    let failNext = true;
    await page.route('**/sessions/*/care-activity', async route => {
      if (route.request().method() === 'PATCH' && failNext) {
        failNext = false;
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fallback();
    });

    await page.getByRole('checkbox', { name: 'Take vital signs' }).check();

    // The save behind Next fails, so the wizard stays put. The edit is still only in the
    // browser: if the stage now believes it is saved, nothing will try again and leaving
    // the page throws the edit away without ever telling the planner.
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Take vital signs')).toBeVisible();

    await page.locator('aside li[title="Care Settings"]').click();

    await expect(page).toHaveURL(/\/care-settings$/);
    await expect
      .poll(() => stub.careActivitySaves.map(save => save.body['bundle-1']?.slice().sort()))
      .toEqual([[STUB_PLANNING_SAVED_ACTIVITY, 'activity-1'].sort()]);
    await expectNoRuntimeOverlay(page);
  });

  test('nothing is written when the planner changed nothing', async ({ page }) => {
    await page.locator('aside li[title="Care Settings"]').click();

    await expect(page).toHaveURL(/\/care-settings$/);
    // The leave save is fire-and-forget, so a stray write would be recorded after the URL
    // changes. Let the destination finish loading — the table only settles once its own
    // fetch resolves — and the network fall quiet, otherwise this snapshot is taken too
    // early to catch the regression it guards.
    await expect(page.getByRole('heading', { name: 'Care Settings', level: 1 })).toBeVisible();
    await expect(page.getByText('No care settings found')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(stub.careActivitySaves).toEqual([]);
  });
});
