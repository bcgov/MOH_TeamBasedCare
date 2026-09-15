import { test, expect, Page } from '@playwright/test';
import {
  seedAuth,
  stubApi,
  ApiStub,
  expectNoRuntimeOverlay,
  STUB_PLANNING_SAVED_ACTIVITY,
} from './fixtures';

/**
 * Stepping through the wizard is not an edit.
 *
 * Next saved the stage every time it was pressed, so walking back and forth through a
 * draft announced "Changes saved automatically" over requests that wrote nothing --
 * telling the planner their work had been saved when nothing had happened, and hiding
 * the announcement that matters when it finally did.
 */

const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';
const DRAFT = 'Emergency Department Plan';
const TOAST = 'Changes saved automatically.';

/** `exact` keeps these off the Next.js dev-tools button, whose name contains "Next". */
const nextButton = (page: Page) => page.getByRole('button', { name: 'Next', exact: true });
const previousButton = (page: Page) => page.getByRole('button', { name: 'Previous', exact: true });

const openDraft = async (page: Page) => {
  await page.goto('/planning');
  await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
  await page.getByRole('button', { name: `Continue ${DRAFT}` }).click();
};

/** Requests that change the draft, so a stage that saved nothing can be told apart. */
const countWrites = (page: Page) => {
  const writes: string[] = [];
  page.on('request', request => {
    if (request.method() !== 'GET' && request.url().includes('/api/v1/')) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  return writes;
};

test.describe('stepping through a draft', () => {
  let stub: ApiStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    stub = await stubApi(page);
  });

  test('Next moves on without saving a stage nobody changed', async ({ page }) => {
    await openDraft(page);
    await expect(page.getByText('Assessment')).toBeVisible();

    const writes = countWrites(page);
    await nextButton(page).click();

    // The wizard still advances -- the point is that it does so silently.
    await expect(page.getByText('Select all the occupations/roles on your team')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(writes).toEqual([]);
    expect(stub.careActivitySaves).toEqual([]);
    await expect(page.getByText(TOAST)).toBeHidden();
    await expectNoRuntimeOverlay(page);
  });

  test('Next still saves, and says so, when the planner changed something', async ({ page }) => {
    await openDraft(page);
    await page.getByText('Assessment').click();
    await page.getByRole('checkbox', { name: 'Take vital signs' }).check();

    await nextButton(page).click();

    await expect(page.getByText(TOAST)).toBeVisible();
    await expect(page.getByText('Select all the occupations/roles on your team')).toBeVisible();
    expect(stub.careActivitySaves).toHaveLength(1);
    expect(stub.careActivitySaves[0].body['bundle-1']?.slice().sort()).toEqual(
      [STUB_PLANNING_SAVED_ACTIVITY, 'activity-1'].sort(),
    );
  });

  test('Previous goes back without saving', async ({ page }) => {
    await openDraft(page);
    await expect(page.getByText('Assessment')).toBeVisible();
    await nextButton(page).click();
    await expect(page.getByText('Select all the occupations/roles on your team')).toBeVisible();

    const writes = countWrites(page);
    await previousButton(page).click();

    await expect(page.getByText('Assessment')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(writes).toEqual([]);
    await expect(page.getByText(TOAST)).toBeHidden();
  });

  test('a stage the draft left invalid still refuses to move on', async ({ page }) => {
    // Registered after the shared stub so it wins: a draft with no roles saved leaves the
    // stage untouched but invalid, and skipping the save must not skip the check too.
    await page.route(/\/sessions\/[^/]+\/occupation$/, async route => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await openDraft(page);
    await expect(page.getByText('Assessment')).toBeVisible();
    await nextButton(page).click();
    await expect(page.getByText('Select all the occupations/roles on your team')).toBeVisible();
    await expect(page.getByText('0 / 2 Selected')).toBeVisible();

    const writes = countWrites(page);
    await nextButton(page).click();

    await expect(page.getByText('At least 1 Occupation is required')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Registered Nurse' })).toBeHidden();
    expect(writes).toEqual([]);
  });
});
