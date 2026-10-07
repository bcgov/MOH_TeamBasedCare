import { render, screen } from '@testing-library/react';
import { CareSettingTemplateRO } from '@tbcm/common';
import { CareSettingsList } from 'src/components/care-settings/list';

const template = (overrides: Partial<CareSettingTemplateRO> = {}) =>
  ({
    id: 'tpl-1',
    name: 'Medical Unit',
    isMaster: false,
    levelLabel: 'Site',
    parentName: 'Acute Care',
    updatedAt: '2026-01-05T00:00:00.000Z',
    ...overrides,
  }) as CareSettingTemplateRO;

const renderList = (careSettings: CareSettingTemplateRO[]) =>
  render(
    <CareSettingsList
      careSettings={careSettings}
      pageIndex={1}
      pageSize={10}
      total={careSettings.length}
      onPageOptionsChange={jest.fn()}
      onSortChange={jest.fn()}
      onEditClick={jest.fn()}
      onCopyClick={jest.fn()}
      onDeleteClick={jest.fn()}
      canModify={() => true}
    />,
  );

describe('CareSettingsList', () => {
  it('names the row-actions column so it is not an empty header', () => {
    renderList([template()]);

    // WCAG 1.3.1: every column needs a programmatic name, even the actions column
    // whose label is deliberately not painted on screen.
    expect(screen.getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Care Setting Name',
      'Level',
      'Parent',
      'Date Modified',
      'Actions',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Actions' }).firstChild).toHaveClass('sr-only');
  });

  it('distinguishes the repeated row actions by care setting name', () => {
    renderList([template(), template({ id: 'tpl-2', name: 'Emergency Department' })]);

    // WCAG 2.4.4: a bare "Create Copy" repeated on every row is ambiguous out of context
    expect(
      screen
        .getAllByRole('button', { name: /^(Edit|Delete|Create Copy of) / })
        .map(button => button.getAttribute('aria-label')),
    ).toEqual([
      'Edit Medical Unit',
      'Delete Medical Unit',
      'Create Copy of Medical Unit',
      'Edit Emergency Department',
      'Delete Emergency Department',
      'Create Copy of Emergency Department',
    ]);
  });
});
