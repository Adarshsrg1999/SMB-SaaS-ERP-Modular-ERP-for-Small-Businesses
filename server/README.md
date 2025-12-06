# ERP Backend API

Node.js/Express server for the SMB SaaS ERP.

## Setup

```bash
cd server
npm install
npm start
```

**Note**: The database file `erp.db` is automatically created on the first run. It is ignored by Git to keep data local.

## API Endpoints

### Authentication
*   `POST /api/auth/register` - Register a new user (Admin/Staff).
*   `POST /api/auth/login` - Login and receive JWT.

### Dashboard
*   `GET /api/dashboard/metrics` - Fetch real-time business metrics (Sales, Customers, Products, Low Stock).
*   `POST /api/dashboard/reset` - **(Beta - Admin Only)** Reset database (wipes business data, keeps Admin).

### Customers
*   `GET /api/customers` - List all customers.
*   `POST /api/customers` - Add a new customer.
*   `PUT /api/customers/:id` - Update customer details.
*   `DELETE /api/customers/:id` - Remove a customer.

### Inventory
*   `GET /api/inventory` - List all products with stock levels.
*   `POST /api/inventory` - Add a new product.
*   `POST /api/inventory/:id/stock` - Adjust stock (In/Out).

### Sales & Orders
*   `GET /api/sales` - List all sales documents (Quotes, Orders, Invoices).
*   `POST /api/sales` - Create a new document.
*   `PATCH /api/sales/:id/status` - Update document status (e.g., convert Quote to Order).

## Database Schema

*   **Users**: `id`, `name`, `email`, `password`, `role`
*   **Customers**: `id`, `name`, `email`, `phone`, `address`, `gst`
*   **Products**: `id`, `name`, `sku`, `price`, `stock_quantity`, `min_stock_level`
*   **SalesDocuments**: `id`, `customer_id`, `type`, `status`, `total`
*   **SaleItems**: `id`, `document_id`, `product_id`, `quantity`, `price`
