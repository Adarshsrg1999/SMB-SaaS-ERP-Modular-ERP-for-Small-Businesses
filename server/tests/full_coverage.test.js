const request = require('supertest');
const app = require('../server');
const db = require('../database');

describe('Full Integration Test Suite', () => {
    let token;
    let createdCustomerId;
    let createdProductId;
    let createdSaleId;

    beforeAll(async () => {
        // Setup Admin User
        const uniqueEmail = `coverage_admin_${Date.now()}@erp.com`;
        await request(app).post('/api/auth/register').send({
            name: 'Coverage Admin',
            email: uniqueEmail,
            password: 'password123',
            role: 'admin'
        });
        const res = await request(app).post('/api/auth/login').send({
            email: uniqueEmail,
            password: 'password123'
        });
        token = res.body.token;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- AUTHENTICATION ---
    describe('Authentication', () => {
        it('should reject login with wrong password', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: 'admin@erp.com',
                password: 'wrongpassword'
            });
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should reject access without token', async () => {
            const res = await request(app).get('/api/customers');
            expect(res.statusCode).toBe(401);
        });

        it('should reject access with invalid token', async () => {
            const res = await request(app).get('/api/customers')
                .set('Authorization', 'Bearer invalidtoken');
            expect(res.statusCode).toBe(403);
        });
    });

    // --- CUSTOMERS ---
    describe('Customers API', () => {
        it('should create a customer', async () => {
            const res = await request(app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Customer',
                    email: 'test@customer.com',
                    phone: '1234567890',
                    address: '123 Test St',
                    gst: 'GST123'
                });
            expect(res.statusCode).toBe(201);
            createdCustomerId = res.body.id;
        });

        it('should update a customer', async () => {
            const res = await request(app)
                .put(`/api/customers/${createdCustomerId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Customer',
                    email: 'updated@customer.com',
                    phone: '0987654321',
                    address: '456 New St',
                    gst: 'GST456'
                });
            expect(res.statusCode).toBe(200);
        });

        it('should delete a customer', async () => {
            const tempRes = await request(app).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'Del', email: 'del@test.com' });
            const idToDelete = tempRes.body.id;

            const res = await request(app)
                .delete(`/api/customers/${idToDelete}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
        });

        it('should get all customers', async () => {
            const res = await request(app).get('/api/customers').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    // --- INVENTORY ---
    describe('Inventory API', () => {
        it('should create a product', async () => {
            const res = await request(app)
                .post('/api/inventory')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Product',
                    sku: `SKU-${Date.now()}`,
                    price: 100,
                    stock_quantity: 50,
                    description: 'Test Desc'
                });
            expect(res.statusCode).toBe(201);
            createdProductId = res.body.id;
        });

        it('should update stock level', async () => {
            const res = await request(app)
                .post(`/api/inventory/${createdProductId}/stock`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    change_amount: 10,
                    type: 'in',
                    reason: 'Restock'
                });
            expect(res.statusCode).toBe(200);
        });

        it('should get all products', async () => {
            const res = await request(app).get('/api/inventory').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
        });
    });

    // --- SALES ---
    describe('Sales API', () => {
        it('should create a sale/quotation', async () => {
            const res = await request(app)
                .post('/api/sales')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    customer_id: createdCustomerId,
                    type: 'quotation',
                    items: [
                        { product_id: createdProductId, quantity: 2, price: 100 }
                    ]
                });
            expect(res.statusCode).toBe(201);
            createdSaleId = res.body.id;
        });

        it('should get sales list with filter', async () => {
            const res = await request(app)
                .get('/api/sales?type=quotation')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should update status', async () => {
            const res = await request(app)
                .patch(`/api/sales/${createdSaleId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });
            expect(res.statusCode).toBe(200);
        });
    });

    // --- ERROR HANDLING & COVERAGE ---
    describe('Error Simulation', () => {
        it('should handle DB errors in GET /customers', async () => {
            jest.spyOn(db, 'all').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).get('/api/customers').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(500);
        });

        it('should handle DB errors in POST /customers', async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).post('/api/customers').set('Authorization', `Bearer ${token}`).send({ name: 'Fail' });
            expect(res.statusCode).toBe(500);
        });

        it('should handle DB errors in PUT /customers/:id', async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).put(`/api/customers/${createdCustomerId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Fail' });
            expect(res.statusCode).toBe(500);
        });

        it('should handle DB errors in DELETE /customers/:id', async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).delete(`/api/customers/${createdCustomerId}`).set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(500);
        });

        it('should handle DB errors in GET /inventory', async () => {
            jest.spyOn(db, 'all').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).get('/api/inventory').set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(500);
        });

        it('should handle DB errors in POST /sales', async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, cb) => cb(new Error('Mock DB Error')));
            const res = await request(app).post('/api/sales').set('Authorization', `Bearer ${token}`).send({ customer_id: 1, items: [] });
            expect(res.statusCode).toBe(500);
        });
    });
});
