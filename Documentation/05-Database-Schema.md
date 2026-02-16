# Database Schema - SMB SaaS ERP

Complete database schema documentation for the ERP system.

---

## 📊 Overview

**Database Type**: SQLite3
**Total Tables**: 20
**Database File**: `erp.db` (production), `erp.test.db` (testing)

---

## 🔐 Core Tables

### users
User accounts and authentication.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'staff',
    theme TEXT DEFAULT 'light',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**: `username` (UNIQUE)

---

### customers
Customer information and contacts.

```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### products
Product catalog with pricing and cost tracking.

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    sku TEXT UNIQUE,
    price REAL,
    cost_price REAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    description TEXT,
    category_id INTEGER,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);
```

**Indexes**: `sku` (UNIQUE)
**Foreign Keys**: `category_id` → `categories(id)`

---

### inventory_logs
Stock movement history and audit trail.

```sql
CREATE TABLE inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    change_amount INTEGER,
    change_type TEXT,
    reason TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Change Types**: `add`, `remove`, `set`

---

### sales_documents
Orders, invoices, and quotations with profit tracking.

```sql
CREATE TABLE sales_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    type TEXT,
    status TEXT,
    total REAL,
    cost REAL DEFAULT 0,
    profit REAL DEFAULT 0,
    fulfillment_status TEXT DEFAULT 'pending',
    packed_at DATETIME,
    shipped_at DATETIME,
    delivered_at DATETIME,
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);
```

**Document Types**: `quotation`, `order`, `invoice`
**Status**: `pending`, `confirmed`, `completed`, `cancelled`
**Fulfillment Status**: `pending`, `packed`, `shipped`, `delivered`, `cancelled`

---

### sale_items
Line items for sales documents.

```sql
CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(document_id) REFERENCES sales_documents(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
```

---

## 🏷️ Organization Tables

### categories
Product categorization with hierarchical support.

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_id) REFERENCES categories(id)
);
```

**Hierarchy**: Self-referencing via `parent_id`

---

### tags
Flexible product tagging system.

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### product_tags
Many-to-many relationship between products and tags.

```sql
CREATE TABLE product_tags (
    product_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## 🏭 Supply Chain Tables

### vendors
Supplier information and ratings.

```sql
CREATE TABLE vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    rating INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Rating**: 0-5 stars

---

### purchase_orders
Purchase order tracking and management.

```sql
CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE,
    vendor_id INTEGER,
    status TEXT DEFAULT 'draft',
    total REAL DEFAULT 0,
    expected_delivery DATE,
    received_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
);
```

**Status**: `draft`, `ordered`, `received`, `cancelled`

---

### purchase_order_items
Line items for purchase orders.

```sql
CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    received_quantity INTEGER DEFAULT 0,
    FOREIGN KEY(po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
);
```

---

### warehouses
Warehouse locations and management.

```sql
CREATE TABLE warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    manager_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manager_id) REFERENCES users(id)
);
```

---

### warehouse_stock
Per-warehouse inventory levels.

```sql
CREATE TABLE warehouse_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 0,
    UNIQUE(warehouse_id, product_id),
    FOREIGN KEY(warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
```

**Constraint**: One stock record per warehouse-product combination

---

### stock_transfers
Inter-warehouse stock movements.

```sql
CREATE TABLE stock_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_warehouse_id INTEGER,
    to_warehouse_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    status TEXT DEFAULT 'pending',
    initiated_by INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(from_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY(to_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(initiated_by) REFERENCES users(id)
);
```

**Status**: `pending`, `completed`, `cancelled`

---

## ✅ Staff Operations Tables

### notifications
In-app notification system.

```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_to TEXT,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_read 
ON notifications(user_id, is_read);
```

**Types**: `info`, `warning`, `success`, `error`

---

### tasks
Task management and to-do lists.

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_to TEXT,
    related_id INTEGER,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX idx_tasks_user_status 
ON tasks(user_id, status);
```

**Priority**: `low`, `medium`, `high`
**Status**: `pending`, `in_progress`, `completed`

---

### sales_targets
Personal sales goal tracking.

```sql
CREATE TABLE sales_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_amount REAL NOT NULL,
    period TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Period**: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`

---

## 🔒 Admin & Security Tables

### audit_logs
Complete activity tracking and audit trail.

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Actions**: `CREATE`, `UPDATE`, `DELETE`

---

### role_permissions
Role-based access control permissions.

```sql
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    module TEXT NOT NULL,
    can_read BOOLEAN DEFAULT 0,
    can_write BOOLEAN DEFAULT 0,
    can_delete BOOLEAN DEFAULT 0,
    UNIQUE(role, module)
);
```

**Roles**: `admin`, `staff`
**Modules**: `customers`, `inventory`, `sales`, `users`, `admin`

---

### settings
System-wide configuration settings.

```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Settings**: `business_name`, `tax_id`, `address`, `phone`, `email`

---

### notification_logs
External notification history (Telegram, etc.).

```sql
CREATE TABLE notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Status**: `sent`, `failed`

---

## 🔗 Relationships

### One-to-Many
- `users` → `inventory_logs`
- `users` → `tasks`
- `users` → `sales_targets`
- `users` → `notifications`
- `customers` → `sales_documents`
- `products` → `sale_items`
- `products` → `inventory_logs`
- `sales_documents` → `sale_items`
- `vendors` → `purchase_orders`
- `purchase_orders` → `purchase_order_items`
- `warehouses` → `warehouse_stock`
- `categories` → `products`
- `categories` → `categories` (self-referencing)

### Many-to-Many
- `products` ↔ `tags` (via `product_tags`)

---

## 📈 Indexes

**Performance Indexes:**
- `idx_notifications_user_read` on `notifications(user_id, is_read)`
- `idx_tasks_user_status` on `tasks(user_id, status)`

**Unique Constraints:**
- `users.username`
- `products.sku`
- `tags.name`
- `purchase_orders.order_number`
- `warehouse_stock(warehouse_id, product_id)`
- `role_permissions(role, module)`
- `settings.key`

---

## 🔄 Data Flow Examples

### Creating a Sale
1. Insert into `sales_documents`
2. Insert multiple rows into `sale_items`
3. Update `products.stock_quantity` (decrease)
4. Insert into `inventory_logs` (change_type: 'remove')
5. Insert into `audit_logs`
6. Calculate and update `cost` and `profit` in `sales_documents`

### Receiving Purchase Order
1. Update `purchase_orders.status` to 'received'
2. Update `purchase_order_items.received_quantity`
3. Update `products.stock_quantity` (increase)
4. Insert into `inventory_logs` (change_type: 'add')
5. Insert into `audit_logs`

### Stock Transfer
1. Insert into `stock_transfers` (status: 'pending')
2. On completion:
   - Decrease `warehouse_stock.quantity` (from warehouse)
   - Increase `warehouse_stock.quantity` (to warehouse)
   - Update `stock_transfers.status` to 'completed'
   - Set `stock_transfers.completed_at`

---

## 🛠️ Maintenance

### Backup
```bash
sqlite3 erp.db ".backup erp_backup.db"
```

### Vacuum (Optimize)
```bash
sqlite3 erp.db "VACUUM;"
```

### Check Integrity
```bash
sqlite3 erp.db "PRAGMA integrity_check;"
```

---

**Last Updated**: February 16, 2026
