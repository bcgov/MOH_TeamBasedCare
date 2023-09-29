import React from 'react';
import { render } from '@testing-library/react';
import Planning from '../../src/pages/planning';

const mockReplace = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('Planning', () => {
  it('does not render content', () => {
    const { container } = render(<Planning />);

    expect(container.firstChild).toBeNull();
  });
});
