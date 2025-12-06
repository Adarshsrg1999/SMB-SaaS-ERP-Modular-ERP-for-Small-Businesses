const request = require('supertest');
const app = require('../server');

describe('Sales API Endpoints', () => {
    let token;
    let customerId;
    let productId;
    let documentId;

    beforeAll(async () => {
        const uniqueEmail = `sales_admin${Date.now()}@erp.com`;

        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Sales Admin',
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

        // Create a customer for sales
        const customerRes = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Sales Customer',
                email: 'salescust@test.com',
                phone: '1234567890'
            });
        customerId = customerRes.body.customerId;

        // Create a product for sales
        const productRes = await request(app)
            .post('/api/inventory')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Sales Product',
                sku: `SALESKU${Date.now()}`,
                price: 100,
                stock_quantity: 100,
                min_stock_level: 10
            });
        productId = productRes.body.productId;
    });

    it('POST /api/sales should create a new sales document', async () => {
        const res = await request(app)
            .post('/api/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customer_id: customerId,
                type: 'quotation',
                items: [
                    {
                        product_id: productId,
                        quantity: 5,
                        price: 100
                    }
                ]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        documentId = res.body.id;
    });

    it('GET /api/sales should return list of sales documents', async () => {
        const res = await request(app)
            .get('/api/sales')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('PATCH /api/sales/:id/status should update document status', async () => {
        const res = await request(app)
            .patch(`/api/sales/${documentId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                status: 'order'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/updated/i);
    });

    it('POST /api/sales should fail without authentication', async () => {
        const res = await request(app)
            .post('/api/sales')
            .send({
                customer_id: customerId,
                type: 'quotation',
                items: []
            });

        expect(res.statusCode).toEqual(401);
    });

    it('GET /api/sales should fail without authentication', async () => {
        const res = await request(app)
            .get('/api/sales');

        expect(res.statusCode).toEqual(401);
    });
});
