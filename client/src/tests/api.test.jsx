import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'test-token');
    });

    describe('Authentication', () => {
        it('login should call correct endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: 'new-token', user: { id: 1, name: 'Test' } })
            });

            const result = await api.login('test@example.com', 'password');

            expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@example.com', password: 'password' })
            }));
            expect(result).toHaveProperty('token');
        });

        it('register should call correct endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ userId: 1, message: 'User created' })
            });

            await api.register('Test', 'test@example.com', 'password');

            expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
                method: 'POST'
            }));
        });
    });

    describe('Users', () => {
        it('getUsers should include auth header', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ([])
            });

            await api.getUsers();

            expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            }));
        });

        it('createUser should send correct data', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ userId: 1 })
            });

            const userData = { name: 'New User', email: 'new@example.com', password: 'pass', role: 'staff' };
            await api.createUser(userData);

            expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(userData)
            }));
        });

        it('updateUser should call correct endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Updated' })
            });

            await api.updateUser(1, { name: 'Updated' });

            expect(global.fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
                method: 'PUT'
            }));
        });

        it('deleteUser should call correct endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Deleted' })
            });

            await api.deleteUser(1);

            expect(global.fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
                method: 'DELETE'
            }));
        });
    });

    describe('Dashboard', () => {
        it('getDashboardMetrics should fetch metrics', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ totalCustomers: 10, totalProducts: 20 })
            });

            const result = await api.getDashboardMetrics();

            expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/metrics', expect.any(Object));
            expect(result).toHaveProperty('totalCustomers');
        });

        it('resetDatabase should call reset endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Reset successful' })
            });

            await api.resetDatabase();

            expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/reset', expect.objectContaining({
                method: 'POST'
            }));
        });
    });
});
