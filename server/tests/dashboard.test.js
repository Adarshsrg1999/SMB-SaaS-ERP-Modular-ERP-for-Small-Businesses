const request = require('supertest');
const app = require('../server');

describe('Dashboard API Endpoints', () => {
    let token;

    beforeAll(async () => {
        // Log in as existing admin (seeded in database.js) or create one
        // Using the default admin creds if available, or create temporary
        const uniqueEmail = `dash_admin${Date.now()}@erp.com`;

        // Try to register first (in case clean db), if fails then login
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Dashboard Admin',
                email: uniqueEmail,
                password: 'password123',
                role: 'admin'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: uniqueEmail,
                password: 'password123'
            });

        token = res.body.token;
    });

    it('GET /api/dashboard/metrics should return metrics structure', async () => {
        const res = await request(app)
            .get('/api/dashboard/metrics')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('totalCustomers');
        expect(res.body).toHaveProperty('totalProducts');
        expect(res.body).toHaveProperty('salesToday');
        expect(res.body).toHaveProperty('salesWeek');
        expect(res.body).toHaveProperty('lowStockItems');
        expect(Array.isArray(res.body.lowStockItems)).toBeTruthy();

        // Type checks
        expect(typeof res.body.totalCustomers).toBe('number');
        expect(typeof res.body.totalProducts).toBe('number');
        expect(typeof res.body.salesToday).toBe('number');
        expect(typeof res.body.salesWeek).toBe('number');
    });
});
