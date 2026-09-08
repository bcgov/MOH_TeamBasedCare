import { render, screen } from '@testing-library/react';
import React from 'react';
import { CareActivityType } from '@tbcm/common';
import { EditCareActivityForm } from '../../../../src/components/content-management/care-activities/edit-care-activity-form';

jest.mock('@services', () => ({
  useBundles: () => ({
    bundles: [{ id: 'bundle-1', name: 'Medication management' }],
  }),
  useCareActivityCMSById: () => ({
    mutate: jest.fn(),
  }),
  useCareActivityCMSEdit: () => ({
    handleSubmit: jest.fn(),
  }),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('../../../../src/components/BackButtonLink', () => ({
  BackButtonLink: () => <button type='button'>Back</button>,
}));

jest.mock('src/components/Select', () => ({
  BasicSelect: ({ id, label }: { id: string; label: string }) => (
    <label htmlFor={id}>
      {label}
      <select id={id} defaultValue=''>
        <option value='' />
      </select>
    </label>
  ),
}));

const careActivity = {
  id: 'activity-1',
  name: 'Administer medications',
  displayName: 'Administer medications',
  description: 'Medication description',
  requirementsAndConsiderations: 'Medication requirements',
  templateNames: 'Acute Care',
  bundle: {
    id: 'bundle-1',
    name: 'Medication management',
    displayName: 'Medication management',
  },
  activityType: CareActivityType.ASPECT_OF_PRACTICE,
} as any;

describe('EditCareActivityForm', () => {
  it('renders fields in the designed order and loads requirements content', () => {
    render(<EditCareActivityForm careActivity={careActivity} />);

    const labels = [
      screen.getByText('Name', { selector: 'label' }),
      screen.getByText('Description', { selector: 'label' }),
      screen.getByText('Requirements and Considerations', { selector: 'label' }),
      screen.getByText('Care settings', { selector: 'label' }),
      screen.getByText('Care competencies', { selector: 'label' }),
      screen.getByText('Aspect of practice', { selector: 'label' }),
    ];

    for (let index = 0; index < labels.length - 1; index += 1) {
      expect(labels[index].compareDocumentPosition(labels[index + 1])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }

    expect(screen.getByDisplayValue('Medication requirements')).toBeInTheDocument();
  });
});
