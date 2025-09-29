import React from 'react';
import { render } from '@testing-library/react';
import Home from '../../src/pages/index';

const mockReplace = jest.fn();
const mockUpdateActivePath = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../../src/components/AppContext', () => ({
  useAppContext: () => ({
    updateActivePath: mockUpdateActivePath,
    state: {
      activePath: '',
      sidebarButtons: [],
      sidebarOpen: false,
    },
    updateSidebarButtons: jest.fn(),
    toggleSidebarOpen: jest.fn(),
  }),
}));

describe('Home', () => {
  it('renders the home page with expected content', () => {
    const { getByText, container } = render(<Home />);

    // Check that the page renders content (not null)
    expect(container.firstChild).not.toBeNull();

    // Check for specific expected content
    expect(getByText('Welcome to Team-Based Model of Care Application')).toBeInTheDocument();
    expect(getByText('Sign In')).toBeInTheDocument();
    expect(getByText('Click here to sign in')).toBeInTheDocument();
  });
});
