# API Reference - SMB SaaS ERP

Complete reference for all API endpoints in the ERP system.

---

## 🔐 Authentication

All API endpoints (except `/api/auth/*`) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Auth Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "role": "admin|staff"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

## 👥 Customers

### List Customers
```http
GET /api/customers
Authorization: Bearer <token>

Response: Array of customer objects
```

### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string"
}
```

### Update Customer
```http
PUT /api/customers/:id
```

### Delete Customer
```http
DELETE /api/customers/:id
```

---

## 📦 Inventory (Products)

### List Products
```http
GET /api/inventory
Query Parameters:
  - category_id: Filter by category
  - tag_id: Filter by tag
  - search: Search by name/SKU
```

### Create Product
```http
POST /api/inventory
Content-Type: application/json

{
  "name": "string",
  "sku": "string",
  "price": number,
  "cost_price": number,
  "stock_quantity": number,
  "min_stock_level": number,
  "description": "string",
  "category_id": number
}
```

### Update Stock
```http
PATCH /api/inventory/:id/stock
Content-Type: application/json

{
  "change_amount": number,
  "change_type": "add|remove|set",
  "reason": "string"
}
```

---

## 💰 Sales

### List Sales Documents
```http
GET /api/sales
Query Parameters:
  - type: quotation|order|invoice
  - status: pending|confirmed|completed|cancelled
```

### Create Sales Document
```http
POST /api/sales
Content-Type: application/json

{
  "customer_id": number,
  "type": "quotation|order|invoice",
  "status": "pending",
  "items": [
    {
      "product_id": number,
      "quantity": number,
      "price": number
    }
  ]
}
```

### Update Fulfillment Status
```http
PATCH /api/sales/:id/fulfillment
Content-Type: application/json

{
  "fulfillment_status": "packed|shipped|delivered",
  "tracking_number": "string" (optional)
}
```

---

## 🏭 Vendors

### List Vendors
```http
GET /api/vendors
```

### Create Vendor
```http
POST /api/vendors
Content-Type: application/json

{
  "name": "string",
  "contact_person": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "tax_id": "string",
  "payment_terms": "string",
  "rating": number (1-5)
}
```

---

## 📋 Purchase Orders

### List Purchase Orders
```http
GET /api/purchase-orders
Query Parameters:
  - status: draft|ordered|received|cancelled
  - vendor_id: Filter by vendor
```

### Create Purchase Order
```http
POST /api/purchase-orders
Content-Type: application/json

{
  "vendor_id": number,
  "expected_delivery": "YYYY-MM-DD",
  "notes": "string",
  "items": [
    {
      "product_id": number,
      "quantity": number,
      "unit_price": number
    }
  ]
}
```

### Receive Purchase Order
```http
POST /api/purchase-orders/:id/receive
Content-Type: application/json

{
  "items": [
    {
      "id": number,
      "received_quantity": number
    }
  ]
}
```

---

## 🏢 Warehouses

### List Warehouses
```http
GET /api/warehouses
```

### Get Warehouse Stock
```http
GET /api/warehouses/:id/stock
```

### Create Stock Transfer
```http
POST /api/transfers
Content-Type: application/json

{
  "from_warehouse_id": number,
  "to_warehouse_id": number,
  "product_id": number,
  "quantity": number,
  "notes": "string"
}
```

### Complete Transfer
```http
PATCH /api/transfers/:id/complete
```

---

## 🔔 Notifications

### List Notifications
```http
GET /api/notifications
Response: Array of notifications (last 100)
```

### Get Unread Count
```http
GET /api/notifications/unread-count
Response: { count: number }
```

### Mark as Read
```http
PATCH /api/notifications/:id/read
```

### Mark All as Read
```http
PATCH /api/notifications/read-all
```

### Delete Notification
```http
DELETE /api/notifications/:id
```

---

## ✅ Tasks

### List Tasks
```http
GET /api/tasks
Query Parameters:
  - status: pending|in_progress|completed
  - priority: low|medium|high
  - related_to: order|customer|product|general
```

### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "due_date": "YYYY-MM-DD",
  "related_to": "string",
  "related_id": number
}
```

### Update Task Status
```http
PATCH /api/tasks/:id/status
Content-Type: application/json

{
  "status": "pending|in_progress|completed"
}
```

---

## 🎯 Sales Targets

### List Targets
```http
GET /api/targets
```

### Get Target Progress
```http
GET /api/targets/:id/progress
Response: {
  target: {...},
  achieved: number,
  percentage: number,
  remaining: number
}
```

### Create Target
```http
POST /api/targets
Content-Type: application/json

{
  "target_amount": number,
  "period": "daily|weekly|monthly|quarterly|yearly",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}
```

---

## 📈 Analytics

### Overall Profit Margin
```http
GET /api/analytics/profit-margin
Query Parameters:
  - start_date: YYYY-MM-DD
  - end_date: YYYY-MM-DD

Response: {
  total_revenue: number,
  total_cost: number,
  total_profit: number,
  profit_margin_percentage: number
}
```

### Profit by Product
```http
GET /api/analytics/profit-by-product
Response: Array of products with profit metrics
```

### Profit Trend
```http
GET /api/analytics/profit-trend
Query Parameters:
  - period: daily|weekly|monthly|yearly
  - start_date: YYYY-MM-DD
  - end_date: YYYY-MM-DD

Response: Array of time-series profit data
```

### Top Profitable Products
```http
GET /api/analytics/top-profitable-products
Query Parameters:
  - limit: number (default 10)
```

---

## 💾 Export

### Export to CSV
```http
GET /api/export/csv/:type
Types: sales|products|customers|inventory
Response: CSV file download
```

### Export to Excel
```http
GET /api/export/excel/:type
Response: .xlsx file download
```

### Export to PDF
```http
GET /api/export/pdf/:type
Response: PDF file download
```

---

## 👤 Users (Admin Only)

### List Users
```http
GET /api/users
```

### Create User
```http
POST /api/users
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "role": "admin|staff"
}
```

### Update User
```http
PUT /api/users/:id
```

### Delete User
```http
DELETE /api/users/:id
```

---

## ⚙️ Admin

### Get Audit Logs
```http
GET /api/admin/audit-logs
Query Parameters:
  - limit: number
  - offset: number
```

### Get System Health
```http
GET /api/admin/health
Response: {
  platform: string,
  nodeVersion: string,
  uptime: number,
  memory: {...},
  database: {...}
}
```

### Get/Update Settings
```http
GET /api/admin/settings
PUT /api/admin/settings
```

---

## 📊 Dashboard

### Get Dashboard Metrics
```http
GET /api/dashboard
Response: {
  totalCustomers: number,
  totalProducts: number,
  totalSales: number,
  lowStockProducts: number,
  recentSales: [...],
  topProducts: [...]
}
```

---

## 🏷️ Categories & Tags

### Categories
```http
GET /api/categories
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id
```

### Tags
```http
GET /api/tags
POST /api/tags
DELETE /api/tags/:id
```

---

## 📥 Import

### Preview CSV Import
```http
POST /api/import/products/preview
Content-Type: multipart/form-data

file: CSV file
```

### Execute CSV Import
```http
POST /api/import/products/execute
Content-Type: multipart/form-data

file: CSV file
```

---

## Error Responses

All endpoints may return these error codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "error": "Error message description"
}
```

---

**Last Updated**: February 16, 2026
