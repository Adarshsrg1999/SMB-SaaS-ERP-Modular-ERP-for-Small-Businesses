import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';
import * as api from '../api';

// Mock the API module
vi.mock('../api', () => ({
    getDashboardMetrics: vi.fn()
}));

describe('Dashboard Component', () => {
    it('renders dashboard with fetched data', async () => {
        const mockData = {
            totalCustomers: 10,
            totalProducts: 50,
            salesToday: 500,
            salesWeek: 2000,
            lowStockItems: [
                { id: 1, name: 'Item A', sku: 'A1', stock_quantity: 2, min_stock_level: 5 }
            ]
        };

        api.getDashboardMetrics.mockResolvedValue(mockData);

        render(<Dashboard />);

        // Should start with loading or fetch immediately
        expect(screen.getByText(/Loading dashboard data.../i)).toBeInTheDocument();

        // Wait for data to appear
        await waitFor(() => {
            // Use findByText or waitFor getByText
            // $500 might be formatted with comma if locale changes but mostly safe for small numbers
            // Actually it is toLocaleString(), so '500' string match
            expect(screen.getByText('$500')).toBeInTheDocument();
        });

        expect(screen.getByText('10')).toBeInTheDocument(); // Customers
        expect(screen.getByText('50')).toBeInTheDocument(); // Products

        // Check Low Stock Table
        expect(screen.getByText('Item A')).toBeInTheDocument();
        expect(screen.getByText('A1')).toBeInTheDocument();
    });
});
