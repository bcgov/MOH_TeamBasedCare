import React from 'react';
import { render } from '@testing-library/react';
import Home from '../../src/pages/index';

const mockReplace = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('Home', () => {
  it('does not render content', () => {
    const { container } = render(<Home />);

    expect(container.firstChild).toBeNull();
  });
});
