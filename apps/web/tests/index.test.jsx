import React from 'react';
import { render } from '@testing-library/react';
import Home from '../src/pages/index';
import * as nextRouter from 'next/router';

nextRouter.useRouter = jest.fn();
const mockReplace = jest.fn();
nextRouter.useRouter.mockImplementation(() => ({ route: '/', replace: mockReplace }));

describe('Home', () => {
  it('redirects to the submission page', () => {
    const { container } = render(<Home />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render content', () => {
    const { container } = render(<Home />);

    expect(container.firstChild).toBeNull();
  });
});
