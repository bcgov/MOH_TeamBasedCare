import { test, expect, Page } from '@playwright/test';
import { seedAuth, stubApi, ApiStub, expectNoRuntimeOverlay } from './fixtures';

/**
 * The planning home is a wizard stage, not a route of its own.
 *
 * Opening a draft moves the wizard to Care Competencies while the URL stays on
 * `/planning`, so the sidebar's Planning item asked the router for a page it was already
 * on, the router did nothing, and the planner was stuck in the draft with no way back to
 * the drafts listing short of a browser reload.
 */

const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';
const SCRATCH_OPTION = 'Start a new profile from scratch';
const DRAFT = 'Emergency Department Plan';

/** The sidebar entry, not the wizard: both render the word "Planning". */
const planningMenuItem = (page: Page) =>
  page
    .getByRole('complementary', { name: 'Sidebar' })
    .getByRole('link', { name: 'Planning', exact: true });

const openDraft = async (page: Page) => {
  await page.goto('/planning');
  await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
  await page.getByRole('button', { name: `Continue ${DRAFT}` }).click();
  await expect(page.getByText('Assessment')).toBeVisible();
};

test.describe('returning to the planning home', () => {
  let stub: ApiStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    stub = await stubApi(page);
  });

  test('the sidebar leaves an open draft for the planning home', async ({ page }) => {
    await openDraft(page);

    await planningMenuItem(page).click();

    // The home the planner came from: the saved-draft option they chose, still chosen,
    // with the drafts listing under it.
    await expect(page.getByRole('radio', { name: SAVED_DRAFT_OPTION })).toBeChecked();
    await expect(page.getByRole('radio', { name: SCRATCH_OPTION })).not.toBeChecked();
    await expect(page.getByRole('button', { name: `Continue ${DRAFT}` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
    await expect(page.getByText('Assessment')).toBeHidden();
    await expectNoRuntimeOverlay(page);
  });

  test('stepping back to the Profile stage keeps the saved-draft option', async ({ page }) => {
    await openDraft(page);

    await page.getByRole('button', { name: 'Previous', exact: true }).click();

    await expect(page.getByRole('radio', { name: SAVED_DRAFT_OPTION })).toBeChecked();
    await expect(page.getByRole('button', { name: `Continue ${DRAFT}` })).toBeVisible();
  });

  test('leaving for the home saves what the stage had unsaved', async ({ page }) => {
    await openDraft(page);
    await page.getByText('Assessment').click();
    await page.getByRole('checkbox', { name: 'Take vital signs' }).check();

    await planningMenuItem(page).click();

    await expect(page.getByRole('button', { name: `Continue ${DRAFT}` })).toBeVisible();
    await expect.poll(() => stub.careActivitySaves).toHaveLength(1);
  });

  test('the sidebar still reaches other pages from an open draft', async ({ page }) => {
    await openDraft(page);

    await page
      .getByRole('complementary', { name: 'Sidebar' })
      .getByRole('link', { name: 'Regulatory terminologies', exact: true })
      .click();

    await expect(page).toHaveURL(/\/care-terminologies/);
  });
});
