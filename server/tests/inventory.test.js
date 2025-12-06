const request = require('supertest');
const app = require('../server');

describe('Inventory API Endpoints', () => {
    let token;
    let productId;

    beforeAll(async () => {
        const uniqueEmail = `inventory_admin${Date.now()}@erp.com`;

        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Inventory Admin',
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

    it('POST /api/inventory should create a new product', async () => {
        const res = await request(app)
            .post('/api/inventory')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Product',
                sku: `SKU${Date.now()}`,
                price: 100,
                stock_quantity: 50,
                min_stock_level: 10
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        productId = res.body.id;
    });

    it('GET /api/inventory should return list of products', async () => {
        const res = await request(app)
            .get('/api/inventory')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('POST /api/inventory/:id/stock should adjust stock', async () => {
        const res = await request(app)
            .post(`/api/inventory/${productId}/stock`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                type: 'in',
                change_amount: 20,
                reason: 'Restock'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/updated/i);
    });

    it('POST /api/inventory/:id/stock should handle stock out', async () => {
        const res = await request(app)
            .post(`/api/inventory/${productId}/stock`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                type: 'out',
                change_amount: 10,
                reason: 'Sale'
            });

        expect(res.statusCode).toEqual(200);
    });

    it('POST /api/inventory should fail without authentication', async () => {
        const res = await request(app)
            .post('/api/inventory')
            .send({
                name: 'Test Product',
                sku: 'SKU001',
                price: 100
            });

        expect(res.statusCode).toEqual(401);
    });

    it('GET /api/inventory should fail without authentication', async () => {
        const res = await request(app)
            .get('/api/inventory');

        expect(res.statusCode).toEqual(401);
    });
});
