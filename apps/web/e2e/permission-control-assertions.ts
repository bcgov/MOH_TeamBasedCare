import { expect, Page } from '@playwright/test';

export async function expectPermissionControlLayout(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const controls = await page.locator('select[id^="permission-"]').evaluateAll(selects =>
    selects.map(element => {
      if (!(element instanceof HTMLSelectElement)) throw new Error('Expected permission select');
      const caret = element.parentElement?.querySelector('svg');
      if (!caret) throw new Error(`Missing caret for ${element.id}`);
      const badge = element.parentElement?.querySelector('button');
      const field = element.getBoundingClientRect();
      const arrow = caret.getBoundingClientRect();
      const label = badge?.getBoundingClientRect();
      const style = getComputedStyle(element);
      // Native option text has no measurable DOM box; measure its actual font instead.
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Canvas text measurement is unavailable');
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const valueWidth = context.measureText(element.value).width;
      const valueRight =
        field.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) + valueWidth;
      const contentWidth =
        field.width -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth) -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);

      return {
        id: element.id,
        value: element.value,
        contentWidth,
        valueWidth,
        valueGap: arrow.left - valueRight,
        caretOffset: arrow.top + arrow.height / 2 - (field.top + field.height / 2),
        caretRightInset: field.right - arrow.right,
        badge:
          label && badge
            ? {
                gap: label.left - arrow.right,
                offset: label.top + label.height / 2 - (field.top + field.height / 2),
                rightInset: field.right - label.right,
                topInset: label.top - field.top,
                bottomInset: field.bottom - label.bottom,
                width: label.width,
                truncated: badge.scrollWidth > badge.clientWidth,
                textOverflow: getComputedStyle(badge).textOverflow,
              }
            : null,
      };
    }),
  );

  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(control.contentWidth, `${control.id}: visible ${control.value}`).toBeGreaterThanOrEqual(
      control.valueWidth,
    );
    expect(control.valueGap, `${control.id}: value/caret gap`).toBeGreaterThan(0);
    expect(Math.abs(control.caretOffset), `${control.id}: caret center`).toBeLessThanOrEqual(0.5);
    if (control.badge) {
      expect(control.badge.gap, `${control.id}: caret/badge gap`).toBeGreaterThan(0);
      expect(Math.abs(control.badge.offset), `${control.id}: badge center`).toBeLessThanOrEqual(
        0.5,
      );
      expect(control.badge.rightInset).toBeGreaterThanOrEqual(1);
      expect(control.badge.topInset).toBeGreaterThanOrEqual(1);
      expect(control.badge.bottomInset).toBeGreaterThanOrEqual(1);
      expect(control.badge.width).toBeGreaterThan(20);
      expect(control.badge.textOverflow).toBe('ellipsis');
    } else {
      expect(control.caretRightInset, `${control.id}: unchanged right caret`).toBeCloseTo(8, 0);
    }
  }
  return controls;
}
