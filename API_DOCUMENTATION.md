# SMB SaaS ERP - API Documentation

Complete API reference with curl commands and Postman-ready examples for testing all endpoints.

**Base URL:** `http://localhost:5000`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users Management](#users-management)
3. [Customers](#customers)
4. [Inventory (Products)](#inventory-products)
5. [Sales Documents](#sales-documents)
6. [Dashboard](#dashboard)
7. [Testing Guide](#testing-guide)

---

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require a JWT token in the Authorization header.

### Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Create a new user account. Default role is 'staff' unless specified.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"
}
```

**Roles:** `admin`, `staff`, `customer`, `vendor`

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "staff"
  }'
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/register `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"name":"John Doe","email":"john@example.com","password":"password123","role":"staff"}'
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

---

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token. **Triggers Telegram notification** with login details.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"john@example.com","password":"password123"}'
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff"
  }
}
```

**Telegram Notification:**
```
🔐 Login Alert

👤 User: John Doe
📧 Email: john@example.com
🕒 Time: 7 Feb 2026, 9:31:36 pm
🌐 IP Address: ::1
```

**Error Response (400):**
```json
{
  "error": "User not found"
}
```
or
```json
{
  "error": "Invalid password"
}
```

---

## Users Management

**⚠️ Admin Only:** All user management endpoints require `admin` role.

### Get All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieve list of all users (passwords excluded).

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri http://localhost:5000/api/users `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@erp.com",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff"
  }
]
```

---

### Create User

**Endpoint:** `POST /api/users`

**Description:** Create a new user (admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepass123",
  "role": "staff"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "securepass123",
    "role": "staff"
  }'
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "userId": 3
}
```

**Error Response (400):**
```json
{
  "error": "Email already exists"
}
```

---

### Update User

**Endpoint:** `PUT /api/users/:id`

**Description:** Update user details. Password is optional.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (with password):**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.smith@example.com",
  "role": "admin",
  "password": "newpassword123"
}
```

**Request Body (without password):**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.smith@example.com",
  "role": "staff"
}
```

**curl Command:**
```bash
curl -X PUT http://localhost:5000/api/users/3 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith Updated",
    "email": "jane.smith@example.com",
    "role": "admin"
  }'
```

**Success Response (200):**
```json
{
  "message": "User updated successfully"
}
```

---

### Delete User

**Endpoint:** `DELETE /api/users/:id`

**Description:** Delete a user. Cannot delete your own account.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X DELETE http://localhost:5000/api/users/3 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Cannot delete your own account"
}
```

---

## Customers

**🔒 Authentication Required:** All customer endpoints require valid JWT token.

### Get All Customers

**Endpoint:** `GET /api/customers`

**Description:** Retrieve all customers, ordered by name.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+91-9876543210",
    "address": "123 Business Park, Mumbai",
    "gst": "27AABCU9603R1ZM"
  }
]
```

---

### Add Customer

**Endpoint:** `POST /api/customers`

**Description:** Create a new customer.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tech Solutions Ltd",
  "email": "info@techsolutions.com",
  "phone": "+91-9123456789",
  "address": "456 Tech Hub, Bangalore",
  "gst": "29AABCT1332L1ZG"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Solutions Ltd",
    "email": "info@techsolutions.com",
    "phone": "+91-9123456789",
    "address": "456 Tech Hub, Bangalore",
    "gst": "29AABCT1332L1ZG"
  }'
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
    name = "Tech Solutions Ltd"
    email = "info@techsolutions.com"
    phone = "+91-9123456789"
    address = "456 Tech Hub, Bangalore"
    gst = "29AABCT1332L1ZG"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/customers `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
```

**Success Response (201):**
```json
{
  "id": 2,
  "message": "Customer added"
}
```

---

### Update Customer

**Endpoint:** `PUT /api/customers/:id`

**Description:** Update customer details.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tech Solutions Private Limited",
  "email": "contact@techsolutions.com",
  "phone": "+91-9123456789",
  "address": "789 New Tech Park, Bangalore",
  "gst": "29AABCT1332L1ZG"
}
```

**curl Command:**
```bash
curl -X PUT http://localhost:5000/api/customers/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Solutions Private Limited",
    "email": "contact@techsolutions.com",
    "phone": "+91-9123456789",
    "address": "789 New Tech Park, Bangalore",
    "gst": "29AABCT1332L1ZG"
  }'
```

**Success Response (200):**
```json
{
  "message": "Customer updated"
}
```

---

### Delete Customer

**Endpoint:** `DELETE /api/customers/:id`

**Description:** Delete a customer.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X DELETE http://localhost:5000/api/customers/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "message": "Customer deleted"
}
```

---

## Inventory (Products)

**🔒 Authentication Required:** All inventory endpoints require valid JWT token.

### Get All Products

**Endpoint:** `GET /api/inventory`

**Description:** Retrieve all products with stock information.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Laptop Dell XPS 15",
    "sku": "DELL-XPS15-001",
    "price": 125000.00,
    "stock_quantity": 15,
    "min_stock_level": 5,
    "description": "15-inch laptop with Intel i7 processor"
  }
]
```

---

### Add Product

**Endpoint:** `POST /api/inventory`

**Description:** Create a new product. Automatically logs initial stock if provided.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Wireless Mouse",
  "sku": "MOUSE-WL-001",
  "price": 1200.00,
  "stock_quantity": 50,
  "description": "Ergonomic wireless mouse with USB receiver"
}
```

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "sku": "MOUSE-WL-001",
    "price": 1200.00,
    "stock_quantity": 50,
    "description": "Ergonomic wireless mouse with USB receiver"
  }'
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
    name = "Wireless Mouse"
    sku = "MOUSE-WL-001"
    price = 1200.00
    stock_quantity = 50
    description = "Ergonomic wireless mouse with USB receiver"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/inventory `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
```

**Success Response (201):**
```json
{
  "id": 2,
  "message": "Product added"
}
```

---

### Update Stock (Inventory Adjustment)

**Endpoint:** `POST /api/inventory/:id/stock`

**Description:** Adjust product stock quantity. Logs the transaction.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "change_amount": 20,
  "type": "in",
  "reason": "Stock replenishment from supplier"
}
```

**Types:**
- `in` - Increase stock (purchase, return from customer)
- `out` - Decrease stock (sale, damage, theft)

**curl Command (Stock In):**
```bash
curl -X POST http://localhost:5000/api/inventory/2/stock \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "change_amount": 20,
    "type": "in",
    "reason": "Stock replenishment from supplier"
  }'
```

**curl Command (Stock Out):**
```bash
curl -X POST http://localhost:5000/api/inventory/2/stock \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "change_amount": 5,
    "type": "out",
    "reason": "Damaged items removed"
  }'
```

**Success Response (200):**
```json
{
  "message": "Stock updated"
}
```

---

## Sales Documents

**🔒 Authentication Required:** All sales endpoints require valid JWT token.

Sales documents include: Quotations, Orders, and Invoices.

### Get All Sales Documents

**Endpoint:** `GET /api/sales`

**Description:** Retrieve all sales documents with customer names.

**Query Parameters:**
- `type` (optional): Filter by document type (`quotation`, `order`, `invoice`)

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command (All Documents):**
```bash
curl -X GET http://localhost:5000/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**curl Command (Filter by Type):**
```bash
curl -X GET "http://localhost:5000/api/sales?type=invoice" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "customer_id": 1,
    "customer_name": "Acme Corporation",
    "type": "invoice",
    "status": "confirmed",
    "total": 150000.00,
    "created_at": "2026-02-07 15:30:00"
  }
]
```

---

### Create Sales Document

**Endpoint:** `POST /api/sales`

**Description:** Create a new quotation, order, or invoice with line items.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": 1,
  "type": "invoice",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 125000.00
    },
    {
      "product_id": 2,
      "quantity": 5,
      "price": 1200.00
    }
  ]
}
```

**Document Types:**
- `quotation` - Price quote for customer (status: `pending`)
- `order` - Confirmed order (status: `confirmed`)
- `invoice` - Final invoice (status: `confirmed`)

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "type": "invoice",
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "price": 125000.00
      },
      {
        "product_id": 2,
        "quantity": 5,
        "price": 1200.00
      }
    ]
  }'
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
    customer_id = 1
    type = "invoice"
    items = @(
        @{
            product_id = 1
            quantity = 2
            price = 125000.00
        },
        @{
            product_id = 2
            quantity = 5
            price = 1200.00
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri http://localhost:5000/api/sales `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
```

**Success Response (201):**
```json
{
  "id": 1,
  "message": "Document created"
}
```

**Note:** Total is calculated automatically: `(2 × 125000) + (5 × 1200) = 256000`

---

### Update Document Status

**Endpoint:** `PATCH /api/sales/:id/status`

**Description:** Update document status or type (e.g., convert quotation to order).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmed",
  "type": "order"
}
```

**Status Values:**
- `pending` - Awaiting approval
- `confirmed` - Approved/Confirmed
- `cancelled` - Cancelled

**curl Command (Update Status):**
```bash
curl -X PATCH http://localhost:5000/api/sales/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

**curl Command (Convert Quotation to Order):**
```bash
curl -X PATCH http://localhost:5000/api/sales/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "status": "confirmed"
  }'
```

**Success Response (200):**
```json
{
  "message": "Document updated"
}
```

---

## Dashboard

**🔒 Authentication Required:** All dashboard endpoints require valid JWT token.

### Get Dashboard Metrics

**Endpoint:** `GET /api/dashboard/metrics`

**Description:** Retrieve key business metrics for dashboard display.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X GET http://localhost:5000/api/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "totalCustomers": 25,
  "totalProducts": 150,
  "salesToday": 45000.00,
  "salesWeek": 320000.00,
  "lowStockItems": [
    {
      "id": 5,
      "name": "USB Cable Type-C",
      "sku": "USB-C-001",
      "stock_quantity": 3,
      "min_stock_level": 10
    }
  ]
}
```

**Metrics Explained:**
- `totalCustomers` - Total number of customers in database
- `totalProducts` - Total number of products in inventory
- `salesToday` - Total sales amount for today (confirmed orders/invoices only)
- `salesWeek` - Total sales amount for last 7 days
- `lowStockItems` - Products where `stock_quantity <= min_stock_level`

---

### Reset Database

**Endpoint:** `POST /api/dashboard/reset`

**Description:** ⚠️ **DANGER:** Clear all data except admin accounts. Admin only.

**Headers:**
```
Authorization: Bearer <token>
```

**curl Command:**
```bash
curl -X POST http://localhost:5000/api/dashboard/reset \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "message": "Database reset successful. All data cleared except Admin accounts."
}
```

**⚠️ Warning:** This action:
- Deletes all customers
- Deletes all products
- Deletes all inventory logs
- Deletes all sales documents
- Deletes all non-admin users
- **Cannot be undone**

---

## Testing Guide

### Step 1: Start the Server

```bash
cd server
npm run dev
```

Server should start on `http://localhost:5000`

---

### Step 2: Create Admin User (First Time Only)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@erp.com",
    "password": "admin123",
    "role": "admin"
  }'
```

---

### Step 3: Login and Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erp.com",
    "password": "admin123"
  }'
```

**Copy the token from the response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE3MDczMjE2OTYsImV4cCI6MTcwNzQwODA5Nn0.abc123..."
}
```

---

### Step 4: Set Token as Environment Variable

**Bash/Linux:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**PowerShell:**
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Now you can use `$TOKEN` or `$token` in your commands!

---

### Step 5: Test Protected Endpoints

**Get all customers:**
```bash
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN"
```

**Add a customer:**
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@customer.com",
    "phone": "+91-9999999999",
    "address": "Test Address",
    "gst": "27AABCU9603R1ZM"
  }'
```

---

### Complete Testing Workflow

Here's a complete workflow to test all major features:

```bash
# 1. Register admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@erp.com","password":"admin123","role":"admin"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"admin123"}'

# 3. Set token (copy from login response)
export TOKEN="YOUR_TOKEN_HERE"

# 4. Create a customer
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","email":"acme@example.com","phone":"+91-9876543210","address":"Mumbai","gst":"27AABCU9603R1ZM"}'

# 5. Create a product
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","sku":"LAP-001","price":50000,"stock_quantity":10,"description":"Dell Laptop"}'

# 6. Create a sale
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"type":"invoice","items":[{"product_id":1,"quantity":2,"price":50000}]}'

# 7. Get dashboard metrics
curl -X GET http://localhost:5000/api/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

To import these APIs into Postman:

1. **Create a new Collection** named "SMB SaaS ERP"

2. **Add Environment Variables:**
   - `base_url`: `http://localhost:5000`
   - `token`: (will be set after login)

3. **Add Requests** using the endpoints above

4. **Set Authorization:**
   - Type: Bearer Token
   - Token: `{{token}}`

5. **Auto-set Token After Login:**
   - In the login request, add this to "Tests" tab:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("token", jsonData.token);
   ```

---

## Common Error Responses

### 401 Unauthorized
```json
Unauthorized
```
**Cause:** Missing or invalid token

**Solution:** Include valid JWT token in Authorization header

---

### 403 Forbidden
```json
Forbidden
```
**Cause:** Valid token but insufficient permissions (e.g., staff trying to access admin endpoint)

**Solution:** Use account with appropriate role

---

### 400 Bad Request
```json
{
  "error": "All fields are required"
}
```
**Cause:** Missing required fields in request body

**Solution:** Check request body matches the documented format

---

### 500 Internal Server Error
```json
{
  "error": "Database error message"
}
```
**Cause:** Server-side error (database, etc.)

**Solution:** Check server logs for details

---

## Tips for Testing

1. **Use JSON Formatter:** Install a JSON formatter browser extension to view responses clearly

2. **Save Tokens:** Store your token in a variable to avoid copying it repeatedly

3. **Check Server Logs:** Monitor the server console for errors and Telegram notification logs

4. **Test Error Cases:** Try invalid data to ensure error handling works

5. **Use Postman Collections:** Save all requests in Postman for easy re-testing

6. **Test Telegram Notifications:** Every login should trigger a Telegram message

---

## Support

For issues or questions:
- Check server logs: `npm run dev` output
- Review error responses
- Verify token is valid and not expired (24h expiry)
- Ensure `.env` file is configured correctly
