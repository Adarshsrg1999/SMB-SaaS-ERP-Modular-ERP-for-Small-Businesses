const request = require('supertest');
const app = require('../server');
const db = require('../database');

describe('User Management API (RBAC)', () => {
    let adminToken;
    let staffToken;
    let staffUserId;

    beforeAll(async () => {
        // 1. Create Admin User & Get Token
        const adminEmail = `admin_test_${Date.now()}@erp.com`;
        await request(app).post('/api/auth/register').send({
            name: 'Admin Test',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: adminEmail,
            password: 'password123'
        });
        adminToken = adminLogin.body.token;

        // 2. Create Staff User & Get Token
        const staffEmail = `staff_test_${Date.now()}@erp.com`;
        const staffReg = await request(app).post('/api/auth/register').send({
            name: 'Staff Test',
            email: staffEmail,
            password: 'password123',
            role: 'staff'
        });
        staffUserId = staffReg.body.userId; // Assuming register returns userId

        const staffLogin = await request(app).post('/api/auth/login').send({
            email: staffEmail,
            password: 'password123'
        });
        staffToken = staffLogin.body.token;
    });

    describe('GET /api/users', () => {
        it('should allow Admin to list users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });

        it('should deny Staff from listing users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('POST /api/users', () => {
        it('should allow Admin to create a new user', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New User',
                    email: `newuser_${Date.now()}@erp.com`,
                    password: 'password123',
                    role: 'staff'
                });
            expect(res.statusCode).toEqual(201);
        });

        it('should allow Admin to create a new Customer user', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Customer',
                    email: `customer_${Date.now()}@erp.com`,
                    password: 'password123',
                    role: 'customer'
                });
            expect(res.statusCode).toEqual(201);
        });

        it('should allow Admin to create a new Vendor user', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Vendor',
                    email: `vendor_${Date.now()}@erp.com`,
                    password: 'password123',
                    role: 'vendor'
                });
            expect(res.statusCode).toEqual(201);
        });

        it('should deny Staff from creating a new user', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    name: 'Hacker User',
                    email: `hacker_${Date.now()}@erp.com`,
                    password: 'password123',
                    role: 'admin'
                });
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should allow Admin to update a user', async () => {
            // Create temp user
            const tempEmail = `update_test_${Date.now()}@erp.com`;
            const createRes = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
                name: 'To Update', email: tempEmail, password: 'password123', role: 'staff'
            });
            const userId = createRes.body.userId;

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Name',
                    email: tempEmail,
                    role: 'manager'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/updated/i);
        });

        it('should allow Admin to update user password', async () => {
            // Create temp user
            const tempEmail = `pwd_test_${Date.now()}@erp.com`;
            const createRes = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
                name: 'To Update Pwd', email: tempEmail, password: 'password123', role: 'staff'
            });
            const userId = createRes.body.userId;

            const res = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'To Update Pwd',
                    email: tempEmail,
                    role: 'staff',
                    password: 'newpassword456'
                });
            expect(res.statusCode).toEqual(200);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should allow Admin to delete a user', async () => {
            // Create a temporary user to delete
            const tempUserEmail = `todelete_${Date.now()}@erp.com`;
            const createRes = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'To Delete',
                    email: tempUserEmail,
                    password: 'password123',
                    role: 'staff'
                });
            const userIdToDelete = createRes.body.userId;

            const res = await request(app)
                .delete(`/api/users/${userIdToDelete}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should deny Staff from deleting a user', async () => {
            // Try to delete the staff user created in beforeAll
            const res = await request(app)
                .delete(`/api/users/${staffUserId}`)
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.statusCode).toEqual(403);
        });
    });
});
