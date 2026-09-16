import { fireEvent, render, screen, within } from '@testing-library/react';
import { ActivityGap, ActivityGapPermissionDetail } from '@tbcm/common';
import { ActivitiesGap } from 'src/components/planning/ActivitiesGap';
import { usePlanningActivitiesGap } from 'src/services';

jest.mock('src/services', () => ({
  usePlanningActivitiesGap: jest.fn(),
  usePlanningOccupations: () => ({ initialValues: { occupation: [] } }),
  usePlanningContext: () => ({
    state: { sessionId: 'session-1' },
    updateRefetchActivityGap: jest.fn(),
  }),
}));
jest.mock('src/services/useHttp', () => ({
  useHttp: () => ({ sendApiRequest: jest.fn() }),
}));
jest.mock('@components', () => ({
  Button: jest.requireActual('src/components/Button').Button,
  PageTitle: () => null,
  ActivitiesGapLegend: () => null,
}));
jest.mock('src/components/Modal', () => ({ ModalWrapper: () => null }));
jest.mock('src/components/OccupationListDropdown', () => ({
  OccupationListDropdown: () => null,
}));
jest.mock('src/components/planning/SuggestionsModal', () => ({ SuggestionsModal: () => null }));
jest.mock('src/components/planning/CurrentSessionName', () => ({ CurrentSessionName: () => null }));
jest.mock('src/components/planning/ActivitiesGap/OverviewCards', () => ({
  OverviewCards: () => null,
}));

const detail: ActivityGapPermissionDetail = {
  bundleName: 'Assessment',
  activityIndex: 0,
  activityName: 'Take vital signs',
  occupationName: 'Nurse',
  limitName: 'Additional education',
  restrictionDescription: 'Complete local training.\nRenew annually.',
};

const renderGap = (
  permissionDetails?: ActivityGapPermissionDetail[],
  activityNames = ['Take vital signs', 'Record intake'],
) => {
  const data: ActivityGap = {
    headers: [
      { title: 'Care Competencies and Corresponding Activities', description: '' },
      { title: 'Nurse', description: '' },
      { title: 'Doctor', description: '' },
    ],
    overview: {},
    data: [
      {
        name: 'Assessment',
        Nurse: 'LC',
        Doctor: 'MIXED',
        careActivities: [
          { name: activityNames[0], Nurse: 'LC', Doctor: 'Y' },
          { name: activityNames[1], Nurse: 'LC', Doctor: '' },
        ],
      },
    ],
    permissionDetails,
  };
  jest.mocked(usePlanningActivitiesGap).mockReturnValue({ initialValues: data, isLoading: false });
  render(<ActivitiesGap step={4} title='Gaps, Optimizations and Suggestions' />);
};

const openSummaryTooltip = (column = 1) => {
  const row = screen.getByRole('row', { name: /Assessment/ });
  fireEvent.click(within(within(row).getAllByRole('cell')[column]).getByRole('button'));
};

const openActivityTooltip = (activityName = 'Take vital signs', column = 1, occurrence = 0) => {
  const summary = screen.getByRole('row', { name: /Assessment/ });
  fireEvent.click(within(within(summary).getAllByRole('cell')[0]).getByRole('button'));
  const row = screen.getAllByRole('row', { name: new RegExp(activityName) })[occurrence];
  fireEvent.click(within(within(row).getAllByRole('cell')[column]).getByRole('button'));
};

describe('planning LC tooltips', () => {
  it('shows saved details for the matching activity and occupation instead of generic copy', async () => {
    renderGap([
      detail,
      { ...detail, occupationName: 'Doctor', limitName: 'Doctor-only limit' },
      {
        ...detail,
        activityIndex: 1,
        activityName: 'Record intake',
        limitName: 'Other activity limit',
      },
      { ...detail, bundleName: 'Other competency', limitName: 'Other competency limit' },
    ]);

    openActivityTooltip();

    expect(await screen.findByText('Additional education', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Complete local training/)).toHaveTextContent(
      'Complete local training. Renew annually.',
    );
    expect(screen.getByText('Limits and Conditions:')).toBeInTheDocument();
    expect(screen.getByText('Restriction Description:')).toBeInTheDocument();
    expect(screen.queryByText(/Nurse can perform with standards/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Doctor-only limit|Other activity limit|Other competency limit/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(
      within(screen.getByRole('row', { name: /Record intake/ })).getAllByRole('cell'),
    ).toHaveLength(3);
  });

  it('groups all available LC details by activity in the competency summary', async () => {
    renderGap([
      detail,
      {
        ...detail,
        activityIndex: 1,
        activityName: 'Record intake',
        limitName: 'Organizational support',
        restrictionDescription: undefined,
      },
    ]);

    openSummaryTooltip();

    expect(await screen.findByText('Take vital signs - Nurse')).toBeInTheDocument();
    expect(screen.getByText('Record intake - Nurse')).toBeInTheDocument();
    expect(screen.getByText(/Additional education/)).toBeInTheDocument();
    expect(screen.getByText(/Organizational support/)).toBeInTheDocument();
    expect(screen.queryByText(/Nurse can perform with standards/)).not.toBeInTheDocument();
  });

  it.each([
    { limitName: 'Additional education', restrictionDescription: undefined },
    { limitName: undefined, restrictionDescription: 'Local policy applies' },
  ])('shows whichever details exist without an empty label: %j', async fields => {
    renderGap([{ ...detail, ...fields }]);

    openActivityTooltip();

    expect(
      await screen.findByText(fields.limitName ?? fields.restrictionDescription!, {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(fields.limitName ? 'Restriction Description:' : 'Limits and Conditions:'),
    ).not.toBeInTheDocument();
  });

  it.each([undefined, []])(
    'keeps the generic LC tooltip when details are unavailable: %j',
    async details => {
      renderGap(details);

      openActivityTooltip();

      expect(
        await screen.findByText(/Nurse can perform with standards, limits, and conditions/),
      ).toBeInTheDocument();
    },
  );

  it('does not borrow details from another LC activity', async () => {
    renderGap([detail]);

    openActivityTooltip('Record intake');

    expect(
      await screen.findByText(/Nurse can perform with standards, limits, and conditions/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Additional education/)).not.toBeInTheDocument();
  });

  it.each([0, 1])(
    'shows only row %s details when activity names are identical',
    async activityIndex => {
      const details = [
        detail,
        {
          ...detail,
          activityIndex: 1,
          limitName: 'Organizational support',
          restrictionDescription: 'Supervisor required',
        },
      ];
      renderGap([...details].reverse(), [detail.activityName, detail.activityName]);

      openActivityTooltip(detail.activityName, 1, activityIndex);

      expect(
        await screen.findByText(details[activityIndex].limitName!, { exact: false }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(details[1 - activityIndex].limitName!, { exact: false }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          details[1 - activityIndex].restrictionDescription!.replace(/\s+/g, ' '),
          { exact: false },
        ),
      ).not.toBeInTheDocument();
    },
  );

  it.each([0, 1])(
    'keeps the generic fallback for same-named row %s without details',
    async activityIndex => {
      renderGap(
        [{ ...detail, activityIndex: 1 - activityIndex }],
        [detail.activityName, detail.activityName],
      );

      openActivityTooltip(detail.activityName, 1, activityIndex);

      expect(
        await screen.findByText(/Nurse can perform with standards, limits, and conditions/),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Additional education/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Complete local training/)).not.toBeInTheDocument();
    },
  );

  it('keeps non-LC tooltips unchanged', async () => {
    renderGap([detail]);

    openActivityTooltip('Take vital signs', 2);

    expect(
      await screen.findByText('Within scope of practice or role description for Doctor'),
    ).toBeInTheDocument();
  });

  it('renders restriction text literally, including occupation placeholders and markup', async () => {
    renderGap([
      { ...detail, restrictionDescription: 'Ask <OCCUPATION> about <b>local policy</b>.' },
    ]);

    openActivityTooltip();

    expect(
      await screen.findByText(/Ask <OCCUPATION> about <b>local policy<\/b>\./),
    ).toBeInTheDocument();
  });
});
