import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the landing headline', () => {
  render(<App />);
  const title = screen.getByText(/Digital Identity Verification/i);
  expect(title).toBeInTheDocument();
});
