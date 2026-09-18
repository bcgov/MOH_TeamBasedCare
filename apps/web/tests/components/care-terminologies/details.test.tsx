import { CareActivityCMSDetailRO } from '@tbcm/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { NextRouter } from 'next/router';
import { CareTerminologyDetails } from '../../../src/components/care-terminologies/details';

jest.mock('../../../src/components/BackButtonLink', () => ({
  BackButtonLink: () => <button type='button'>Back</button>,
}));

const activities = [
  { id: 'activity-1', displayName: 'Current activity' },
  { id: 'activity-2', displayName: 'Related activity two' },
  { id: 'activity-3', displayName: 'Related activity three' },
];

const createCareActivity = (careActivities = activities) =>
  new CareActivityCMSDetailRO({
    ...activities[0],
    description: 'Activity description.',
    requirementsAndConsiderations: 'Activity requirements.',
    bundle: {
      id: 'bundle-1',
      displayName: 'Care competency',
      careActivities,
    },
  });

describe('CareTerminologyDetails', () => {
  it('links every other activity in the bundle to its terminology page', () => {
    render(<CareTerminologyDetails careActivity={createCareActivity()} />);

    expect(screen.getByRole('button', { name: 'Related Activities' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Current activity' })).not.toBeInTheDocument();

    for (const activity of activities.slice(1)) {
      expect(screen.getByRole('link', { name: activity.displayName })).toHaveAttribute(
        'href',
        `/care-terminologies/${activity.id}`,
      );
    }
  });

  it.each(activities.slice(1))('navigates to $displayName when clicked', activity => {
    const router: NextRouter = {
      basePath: '',
      pathname: '/care-terminologies/[id]',
      route: '/care-terminologies/[id]',
      query: { id: activities[0].id },
      asPath: `/care-terminologies/${activities[0].id}`,
      push: jest.fn().mockResolvedValue(true),
      replace: jest.fn().mockResolvedValue(true),
      reload: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
    };

    render(
      <RouterContext.Provider value={router}>
        <CareTerminologyDetails careActivity={createCareActivity()} />
      </RouterContext.Provider>,
    );

    fireEvent.click(screen.getByRole('link', { name: activity.displayName }));

    expect(router.push).toHaveBeenCalledWith(
      `/care-terminologies/${activity.id}`,
      `/care-terminologies/${activity.id}`,
      expect.objectContaining({ shallow: undefined, scroll: true }),
    );
  });

  it.each([
    ['only the current activity', createCareActivity([activities[0]])],
    ['an empty bundle', createCareActivity([])],
    [
      'a bundle without activities',
      new CareActivityCMSDetailRO({ ...activities[0], bundle: { id: 'bundle-1' } }),
    ],
    ['no bundle', new CareActivityCMSDetailRO(activities[0])],
  ])('shows the empty state for %s', (_scenario, careActivity) => {
    render(<CareTerminologyDetails careActivity={careActivity} />);

    expect(screen.getByText('No related activities available.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
