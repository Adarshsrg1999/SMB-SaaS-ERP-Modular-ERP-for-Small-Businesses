const request = require('supertest');
const app = require('../server');

describe('Customers API Endpoints', () => {
    let token;
    let customerId;

    beforeAll(async () => {
        const uniqueEmail = `customer_admin${Date.now()}@erp.com`;

        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Customer Admin',
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

    it('POST /api/customers should create a new customer', async () => {
        const res = await request(app)
            .post('/api/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Corp',
                email: 'test@corp.com',
                phone: '1234567890',
                address: '123 Test St',
                gst: 'GST123'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        customerId = res.body.id;
    });

    it('GET /api/customers should return list of customers', async () => {
        const res = await request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('PUT /api/customers/:id should update customer', async () => {
        const res = await request(app)
            .put(`/api/customers/${customerId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Corp',
                email: 'updated@corp.com',
                phone: '0987654321',
                address: '456 New St',
                gst: 'GST456'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/updated/i);
    });

    it('DELETE /api/customers/:id should delete customer', async () => {
        const res = await request(app)
            .delete(`/api/customers/${customerId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it('POST /api/customers should fail without authentication', async () => {
        const res = await request(app)
            .post('/api/customers')
            .send({
                name: 'Test Corp',
                email: 'test@corp.com'
            });

        expect(res.statusCode).toEqual(401);
    });

    it('GET /api/customers should fail without authentication', async () => {
        const res = await request(app)
            .get('/api/customers');

        expect(res.statusCode).toEqual(401);
    });
});
