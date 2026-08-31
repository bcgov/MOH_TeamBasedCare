import { test, expect } from '@playwright/test';
import { seedAuth, stubApi, trackPageErrors, expectNoRuntimeOverlay, ApiStub } from './fixtures';

/**
 * Real-browser coverage for the planning sessions table.
 *
 * jsdom cannot catch every defect here: it renders through a different JSX
 * transform than Next ships, so bugs that depend on React 19 dropping
 * `defaultProps` only surface in an actual browser.
 */
test.describe('planning sessions table', () => {
  let stub: ApiStub;

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    stub = await stubApi(page);
  });

  test('lists the current user sessions', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/planning');

    await expect(page.getByText('Emergency Department Plan')).toBeVisible();
    await expect(page.getByText('Intensive Care Unit Plan')).toBeVisible();

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('session names are display-only in the planning table', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/planning');

    await expect(
      page.getByRole('button', { name: 'Emergency Department Plan', exact: true }),
    ).toHaveCount(0);
    await expectNoRuntimeOverlay(page);

    expect(errors).toEqual([]);
  });

  test('sorting does not submit the surrounding form or reload the page', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/planning');
    await expect(page.getByText('Emergency Department Plan')).toBeVisible();

    await page.evaluate(() => {
      (window as unknown as { __stayed: boolean }).__stayed = true;
    });

    await page.getByRole('button', { name: 'Sort by Planning name' }).click();

    // A form submit would navigate and wipe the marker.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __stayed?: boolean }).__stayed))
      .toBe(true);

    await expectNoRuntimeOverlay(page);
    expect(errors).toEqual([]);
  });

  test('the sessions table is rendered below the Select Care Setting dropdown', async ({
    page,
  }) => {
    await page.goto('/planning');
    await expect(page.getByText('Emergency Department Plan')).toBeVisible();

    const order = await page.evaluate(() => {
      const select = document.querySelector('select[name="careLocation"]');
      const table = document.querySelector('table[aria-label="Your saved planning drafts"]');
      if (!select || !table) return null;
      // DOCUMENT_POSITION_FOLLOWING (4) means the table comes after the dropdown.
      return Boolean(select.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING);
    });

    expect(order).toBe(true);
  });

  test('cells are vertically centred and dates use the short format', async ({ page }) => {
    await page.goto('/planning');

    const row = page.locator('tbody tr').first();
    await expect(row).toBeVisible();

    const rowBox = await row.boundingBox();
    const rowCentre = (rowBox?.y ?? 0) + (rowBox?.height ?? 0) / 2;

    // Every cell's content should sit on the row's centre line
    const cells = row.locator('td');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const box = await cells.nth(i).boundingBox();
      const centre = (box?.y ?? 0) + (box?.height ?? 0) / 2;
      // sub-pixel layout rounding makes an exact match unreliable
      expect(Math.abs(centre - rowCentre)).toBeLessThanOrEqual(1.5);
    }

    const nameBox = await cells.nth(0).boundingBox();
    const continueBox = await row.getByRole('button', { name: /^Continue/ }).boundingBox();
    const nameCentre = (nameBox?.y ?? 0) + (nameBox?.height ?? 0) / 2;
    const continueCentre = (continueBox?.y ?? 0) + (continueBox?.height ?? 0) / 2;
    // 1px of slack absorbs sub-pixel rounding between the row box and the button boxes
    expect(Math.abs(nameCentre - continueCentre)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(nameCentre - rowCentre)).toBeLessThanOrEqual(1.5);

    // e.g. `Jan 15, 2026 2:30AM` - abbreviated month, no space before the meridiem
    const shortDateTime = /^[A-Z][a-z]{2} \d{2}, \d{4} \d{1,2}:\d{2}\s(AM|PM)$/;
    await expect(cells.nth(2)).toHaveText(shortDateTime);
    await expect(cells.nth(3)).toHaveText(shortDateTime);
  });

  test('the plan title presents a Rename action after continuing a draft', async ({ page }) => {
    await page.goto('/planning');

    const longName = 'Emergency Department Plan';
    await page
      .locator('tbody tr')
      .first()
      .getByRole('button', { name: `Continue ${longName}` })
      .click();

    const title = page.getByRole('heading', { name: longName, exact: true });
    await expect(title).toBeVisible();
    await page.getByRole('button', { name: 'Rename' }).click();

    const dialog = page.getByRole('dialog', { name: 'Rename' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Rename Care plan draft');

    const input = dialog.getByRole('textbox', { name: 'Name' });
    await expect(input).toBeVisible();

    // No horizontal overflow: the full value fits inside the visible box
    const fits = await input.evaluate((el: HTMLInputElement) => el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(true);
  });

  test('the name in the table is not an interactive control', async ({ page }) => {
    await page.goto('/planning');

    await expect(
      page.getByRole('button', { name: 'Emergency Department Plan', exact: true }),
    ).toHaveCount(0);
  });

  test('the auto-selected last draft remains available from the sessions table', async ({
    page,
  }) => {
    stub.lastDraft = stub.sessions[0];

    await page.goto('/planning');

    // The "continue your last draft" option is pre-selected...
    const lastDraftOption = page.getByRole('radio', {
      name: /Continue working on your last draft/,
    });
    await expect(lastDraftOption).toBeChecked();

    await expect(page.locator('tbody')).toContainText(stub.sessions[0].name);
  });

  test('starting from scratch names the draft, advances the stage, and lists the draft', async ({
    page,
  }) => {
    await page.goto('/planning');

    await page.getByRole('radio', { name: 'Start a new profile from scratch' }).check();
    await page
      .locator('select[name="careLocation"]')
      .selectOption({ label: 'Emergency Department' });

    // the stepper toolbar is aria-hidden, so match on text rather than role
    await page.locator('button:text-is("Next")').click();

    // The first-save naming modal appears...
    const modalInput = page.locator('#session-name');
    await expect(modalInput).toBeVisible();
    await modalInput.fill('My Brand New Plan');
    await page.locator('button:text-is("Save")').click();

    // ...confirming it closes the modal and stores the name...
    await expect(modalInput).toHaveCount(0);
    await expect.poll(() => stub.renames.map(r => r.name)).toContain('My Brand New Plan');

    // ...and the wizard has left the Profile stage (regression: it used to stay put, and
    // every further Next click was a no-op).
    await expect(page.getByRole('radio', { name: 'Start a new profile from scratch' })).toHaveCount(
      0,
    );
    await expect(page.locator('button:text-is("Previous")')).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'My Brand New Plan' })).toBeVisible();

    // Returning to Profile, the drafts table lists the newly created draft
    await page.locator('button:text-is("Previous")').click();
    await expect(page.locator('tbody')).toContainText('My Brand New Plan');
  });

  test('a second draft created in the same visit is also prompted for a name', async ({ page }) => {
    await page.goto('/planning');

    const createDraft = async (name: string) => {
      await page.getByRole('radio', { name: 'Start a new profile from scratch' }).check();
      await page
        .locator('select[name="careLocation"]')
        .selectOption({ label: 'Emergency Department' });
      await page.locator('button:text-is("Next")').click();

      const modalInput = page.locator('#session-name');
      await expect(modalInput).toBeVisible();
      await modalInput.fill(name);
      await page.locator('button:text-is("Save")').click();
      await expect(modalInput).toHaveCount(0);
    };

    await createDraft('First Draft Of Today');

    // Back to Profile and start over: the prompt used to be suppressed for the rest of the
    // visit by a once-per-mount ref, so this second draft kept its generated name.
    await page.locator('button:text-is("Previous")').click();
    await createDraft('Second Draft Of Today');

    expect(stub.created).toHaveLength(2);
    await expect
      .poll(() => stub.renames.map(r => r.name))
      .toEqual(['First Draft Of Today', 'Second Draft Of Today']);
  });

  test('the duplicate-name error clears when the inline input is focused again', async ({
    page,
  }) => {
    await page.goto('/planning');

    await page.getByRole('button', { name: 'Continue Emergency Department Plan' }).click();
    await page.getByRole('button', { name: 'Rename' }).click();

    const dialog = page.getByRole('dialog', { name: 'Rename' });
    const input = dialog.getByRole('textbox', { name: 'Name' });
    await input.fill('Intensive Care Unit Plan'); // already taken by another draft
    await dialog.getByRole('button', { name: 'Save' }).click();

    const message = page.locator(`#rename-session-name-error-${stub.sessions[0].id}`);
    await expect(message).toHaveText('A planning session with this name already exists.');

    // Coming back to the field means the planner is correcting it -- the rejection is stale
    await input.click();
    await expect(message).toHaveCount(0);
  });

  test('the duplicate-name error in the naming modal clears when the input is focused again', async ({
    page,
  }) => {
    await page.goto('/planning');

    await page.getByRole('radio', { name: 'Start a new profile from scratch' }).check();
    await page
      .locator('select[name="careLocation"]')
      .selectOption({ label: 'Emergency Department' });
    await page.locator('button:text-is("Next")').click();

    const modalInput = page.locator('#session-name');
    await expect(modalInput).toBeVisible();
    await modalInput.fill('Ambulatory Care Plan'); // already taken
    await page.locator('button:text-is("Save")').click();

    const message = page.locator('#session-name-error');
    await expect(message).toHaveText('A planning session with this name already exists.');

    await modalInput.click();
    await expect(message).toHaveCount(0);

    // ...and re-submitting the same clashing name surfaces the message again
    await page.locator('button:text-is("Save")').click();
    await expect(message).toHaveText('A planning session with this name already exists.');
  });

  test('the drafts table matches the design: no section title, full-width search, link actions', async ({
    page,
  }) => {
    await page.goto('/planning');

    await expect(page.getByRole('heading', { name: 'Your drafts' })).toHaveCount(0);

    const table = page.locator('table[aria-label="Your saved planning drafts"]');
    const search = page.getByPlaceholder('Search by keyword');

    // The search bar spans the table, rather than sitting at half width
    const searchBox = await search.boundingBox();
    const tableBox = await table.boundingBox();
    expect(searchBox?.width ?? 0).toBeGreaterThan((tableBox?.width ?? 0) * 0.95);

    // Gold rule under the header row
    await expect(table.locator('th').first()).toHaveCSS('border-bottom-color', 'rgb(252, 186, 25)');

    // Continue/Discard are underlined links, Discard in the error red
    const row = page.locator('tbody tr').first();
    const discard = row.getByRole('button', { name: /^Discard / });
    await expect(discard).toHaveCSS('text-decoration-line', 'underline');
    // red-700; bcRedError (#D8292F) fails AA contrast against the zebra rows
    await expect(discard).toHaveCSS('color', 'rgb(185, 28, 28)');
    const cont = row.getByRole('button', { name: /^Continue / });
    await expect(cont).toHaveCSS('text-decoration-line', 'underline');

    // Row height floor and type sizes
    const rowBox = await row.boundingBox();
    expect(rowBox?.height ?? 0).toBeGreaterThanOrEqual(74);
    await expect(row.locator('td').nth(1)).toHaveCSS('font-size', '14px');
    await expect(cont).toHaveCSS('font-size', '15px');
    await expect(discard).toHaveCSS('font-size', '15px');
  });
});
