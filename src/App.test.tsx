import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders successfully with the title "Balangay"', () => {
    render(<App />);
    const titleElements = screen.getAllByText(/Balangay/i);
    expect(titleElements.length).toBeGreaterThan(0);
    expect(titleElements[0]).toBeInTheDocument();
  });
});
