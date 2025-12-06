import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Customers from '../pages/Customers';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

const renderWithProviders = (ui) => {
    return render(
        <ThemeProvider>
            <ToastProvider>
                {ui}
            </ToastProvider>
        </ThemeProvider>
    );
};

describe('Customers Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders customer list', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 1, name: 'John Doe', email: 'john@example.com', phone: '123', gst: 'GST001' }]
        });

        renderWithProviders(<Customers />);

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Customer List')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles add customer form validation', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] }); // Initial fetch

        renderWithProviders(<Customers />);

        await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Add Customer'));

        const saveBtn = screen.getByText('Save Customer');
        fireEvent.click(saveBtn);

        expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
});
