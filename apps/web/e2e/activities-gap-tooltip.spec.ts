import { test, expect, Page } from '@playwright/test';
import { seedAuth, stubApi, expectNoRuntimeOverlay, STUB_PLANNING_OCCUPATIONS } from './fixtures';

/**
 * Gap grid tooltips are sized to their text.
 *
 * The mixed and limits-and-conditions wordings are the longest in the grid, and the box
 * carried both `w-[200px]` and `w-auto`; the later utility won, so an absolutely
 * positioned panel shrank to its narrowest fit -- about 90-110px -- and wrapped the copy
 * into a tall, hard-to-read ribbon. Driven in the browser because the defect is purely a
 * matter of the laid-out box, which jsdom does not compute.
 */

const SAVED_DRAFT_OPTION = 'Continue working on a saved draft plan';
const DRAFT = 'Emergency Department Plan';

/** Comfortably past the ~110px the collapsed box used to occupy. */
const MIN_READABLE_WIDTH = 200;
/** `lg:max-w-[30rem]`, at the default 1280px-wide viewport. */
const MAX_WIDTH = 480;
/** Two wrapped lines plus padding. A ribbon of the old width ran several times taller. */
const MAX_HEIGHT = 100;

const [RN, LPN] = STUB_PLANNING_OCCUPATIONS;

/** Opens the icon in the given column of the collapsed bundle row. */
const openTooltip = async (page: Page, column: number) => {
  const row = page.locator('tbody tr').first();
  await row.locator('td').nth(column).getByRole('button').click();
  return page.locator('[id^="headlessui-popover-panel"] div').last();
};

test.describe('gaps, optimizations and suggestions tooltips', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubApi(page);

    await page.goto('/planning');
    await page.getByRole('radio', { name: SAVED_DRAFT_OPTION }).check();
    await page.getByRole('button', { name: `Continue ${DRAFT}` }).click();

    // `exact` keeps this off Next.js' dev tools button, whose name contains "Next".
    const next = page.getByRole('button', { name: 'Next', exact: true });

    // Continue lands on Care Competencies; step through to the gap grid.
    await expect(page.getByText('Assessment')).toBeVisible();
    await next.click();
    // The occupation checkboxes carry no accessible name, so the roll-up is what confirms
    // the draft's saved role loaded and the stage is valid enough to move on.
    await expect(page.getByText('1 / 2 Selected')).toBeVisible();
    await next.click();

    await expect(page.getByRole('columnheader', { name: RN.name })).toBeVisible();
  });

  test('the mixed tooltip reads across the box rather than down it', async ({ page }) => {
    const tooltip = await openTooltip(page, 1);

    await expect(tooltip).toContainText(
      `${RN.name} can perform some care activities with organizational support or additional education`,
    );

    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(MIN_READABLE_WIDTH);
    expect(box!.width).toBeLessThanOrEqual(MAX_WIDTH);
    expect(box!.height).toBeLessThanOrEqual(MAX_HEIGHT);
    await expectNoRuntimeOverlay(page);
  });

  test('the limits and conditions tooltip reads across the box rather than down it', async ({
    page,
  }) => {
    const tooltip = await openTooltip(page, 2);

    await expect(tooltip).toContainText(
      `${LPN.name} can perform with standards, limits, and conditions`,
    );

    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(MIN_READABLE_WIDTH);
    expect(box!.width).toBeLessThanOrEqual(MAX_WIDTH);
    expect(box!.height).toBeLessThanOrEqual(MAX_HEIGHT);
    await expectNoRuntimeOverlay(page);
  });

  test('a widened tooltip still stays on screen', async ({ page }) => {
    // The later columns flip to bottom-left, which translates the panel across its own
    // width -- the case a wider box is most likely to push off the viewport.
    const tooltip = await openTooltip(page, 2);

    const box = await tooltip.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  });
});
