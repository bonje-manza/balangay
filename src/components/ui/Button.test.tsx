import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button, ButtonVariant } from './Button';

describe('Button Component', () => {
  it('renders children and responds to click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['primary', 'bg-[#111111]'],
    ['forest', 'bg-[#124224]'],
    ['butter', 'bg-[#FFED9E]'],
    ['blossom', 'bg-[#F2C0CA]'],
    ['pistachio', 'bg-[#DAE097]'],
    ['sky', 'bg-[#A6CFF2]'],
    ['outline', 'bg-transparent'],
    ['ghost', 'hover:bg-'],
  ] as [ButtonVariant, string][])(
    'applies correct styling for variant %s',
    (variant, expectedClass) => {
      render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole('button', { name: variant });
      expect(button.className).toContain(expectedClass);
      expect(button.className).toContain('active:translate-y-0.5');
    }
  );

  it('renders with icon prefix and postfix', () => {
    render(
      <Button
        icon={<span data-testid="left-icon">L</span>}
        iconRight={<span data-testid="right-icon">R</span>}
      >
        Action
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('handles disabled state properly', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('displays loading spinner and disables button when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });
});
