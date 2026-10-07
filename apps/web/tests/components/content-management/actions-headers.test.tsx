import { render, screen } from '@testing-library/react';
import { CareActivitiesCMSList } from 'src/components/content-management/care-activities/list';
import { OccupationsCMSList } from 'src/components/content-management/occupations/list';

describe('content management action headers', () => {
  it('shows the Actions header in the care activities table', () => {
    render(
      <CareActivitiesCMSList
        careActivities={[]}
        pageIndex={1}
        pageSize={10}
        total={0}
        onPageOptionsChange={jest.fn()}
        onSortChange={jest.fn()}
        onDeleteCareActivityClick={jest.fn()}
        onEditClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  it('shows the Actions header in the occupations table', () => {
    render(
      <OccupationsCMSList
        occupations={[]}
        pageIndex={1}
        pageSize={10}
        total={0}
        onPageOptionsChange={jest.fn()}
        onSortChange={jest.fn()}
        onDeleteOccupationClick={jest.fn()}
        onEditClick={jest.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });
});
