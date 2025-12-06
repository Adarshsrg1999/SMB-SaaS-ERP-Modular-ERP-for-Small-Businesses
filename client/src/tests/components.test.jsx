import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { vi } from 'vitest';

describe('UI Components', () => {
    describe('Input', () => {
        it('renders with label and handles change', () => {
            const handleChange = vi.fn();
            render(<Input id="test-input" label="Test Label" onChange={handleChange} placeholder="Enter text" />);

            expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
            const input = screen.getByPlaceholderText('Enter text');
            fireEvent.change(input, { target: { value: 'New Value' } });
            expect(handleChange).toHaveBeenCalled();
        });

        it('shows error message', () => {
            render(<Input id="err-input" label="Err" error="Invalid input" />);
            expect(screen.getByText('Invalid input')).toBeInTheDocument();
            expect(screen.getByLabelText('Err')).toHaveClass('is-invalid');
        });
    });

    describe('Button', () => {
        it('renders children and handles click', () => {
            const handleClick = vi.fn();
            render(<Button onClick={handleClick}>Click Me</Button>);

            const btn = screen.getByText('Click Me');
            fireEvent.click(btn);
            expect(handleClick).toHaveBeenCalled();
        });

        it('shows loading spinner when isLoading is true', () => {
            render(<Button isLoading={true}>Submit</Button>);
            expect(screen.getByRole('button')).toBeDisabled();
            expect(screen.getByRole('status')).toBeInTheDocument(); // spinner role
        });
    });

    describe('Spinner', () => {
        it('renders', () => {
            const { container } = render(<Spinner />);
            expect(container.firstChild).toBeInTheDocument();
        });
    });
});
