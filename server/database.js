const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Use test database when NODE_ENV is 'test'
const dbName = process.env.NODE_ENV === 'test' ? 'erp.test.db' : 'erp.db';
const dbPath = path.resolve(__dirname, dbName);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Users Table (RBAC)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'staff', -- admin, manager, staff
        theme_preference TEXT DEFAULT 'light'
    )`);

    // 2. Customers Table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        gst TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Products & Inventory Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
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
    )`);

    // 4. Inventory Logs (Stock History)
    db.run(`CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        change_amount INTEGER,
        type TEXT, -- 'in', 'out', 'adjustment'
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // 5. Sales Documents (Quotes, Orders, Invoices)
    db.run(`CREATE TABLE IF NOT EXISTS sales_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        type TEXT, -- 'quotation', 'order', 'invoice'
        status TEXT, -- 'pending', 'confirmed', 'completed', 'cancelled'
        total REAL,
        cost REAL DEFAULT 0,
        profit REAL DEFAULT 0,
        fulfillment_status TEXT DEFAULT 'pending', -- 'pending', 'packed', 'shipped', 'delivered', 'cancelled'
        packed_at DATETIME,
        shipped_at DATETIME,
        delivered_at DATETIME,
        tracking_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`);

    // 6. Sale Items (Line items for documents)
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price REAL,
        FOREIGN KEY(document_id) REFERENCES sales_documents(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // 7. Notification Logs (Persistent Audit Trail)
    db.run(`CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT, -- JSON string of payload
        status TEXT NOT NULL, -- 'sent', 'failed'
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 8. Activity Audit Logs (Story 1)
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
        entity TEXT NOT NULL, -- 'product', 'customer', 'sale', 'user'
        entity_id INTEGER,
        changes TEXT, -- JSON string of before/after
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 9. System Settings & Business Profile (Story 5)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 10. Categories (Story 27)
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(parent_id) REFERENCES categories(id)
    )`);

    // 11. Tags (Story 27)
    db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3b82f6'
    )`);

    // 12. Product-Tag Junction (Story 27)
    db.run(`CREATE TABLE IF NOT EXISTS product_tags (
        product_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY(product_id, tag_id),
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )`);

    // 13. Vendors (Story 17)
    db.run(`CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_id TEXT,
        payment_terms TEXT,
        rating INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 14. Purchase Orders (Story 17)
    db.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        order_number TEXT UNIQUE,
        status TEXT DEFAULT 'draft',
        total REAL DEFAULT 0,
        expected_delivery DATE,
        received_at DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(vendor_id) REFERENCES vendors(id)
    )`);

    // 15. Purchase Order Items (Story 17)
    db.run(`CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        po_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        received_quantity INTEGER DEFAULT 0,
        FOREIGN KEY(po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // 16. Warehouses (Story 28)
    db.run(`CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        location TEXT,
        manager_id INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(manager_id) REFERENCES users(id)
    )`);

    // 17. Warehouse Stock (Story 28)
    db.run(`CREATE TABLE IF NOT EXISTS warehouse_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warehouse_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        UNIQUE(warehouse_id, product_id),
        FOREIGN KEY(warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);

    // 18. Stock Transfers (Story 28)
    db.run(`CREATE TABLE IF NOT EXISTS stock_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_warehouse_id INTEGER NOT NULL,
        to_warehouse_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        initiated_by INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY(from_warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY(to_warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(initiated_by) REFERENCES users(id)
    )`);

    // 19. Notifications (Story 10 - Phase 3)
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error'
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_to TEXT, -- 'order', 'product', 'task', 'customer', etc.
        related_id INTEGER,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Create index for faster queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
            ON notifications(user_id, is_read)`);

    // 20. Tasks (Story 9 - Phase 3)
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        related_to TEXT, -- 'order', 'customer', 'product', 'general'
        related_id INTEGER,
        priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
        status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
        due_date DATE,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Create index for faster task queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_user_status 
            ON tasks(user_id, status)`);

    // 21. Sales Targets (Story 8 - Phase 3)
    db.run(`CREATE TABLE IF NOT EXISTS sales_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_amount REAL NOT NULL,
        period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 20. Role Permissions (Story 3)
    db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        module TEXT NOT NULL,
        permission TEXT NOT NULL, -- 'read', 'write', 'delete', 'all'
        UNIQUE(role, module, permission)
    )`);

    // Seed Default Permissions
    const defaultPermissions = [
        ['admin', 'all', 'all'],
        ['staff', 'inventory', 'read'],
        ['staff', 'inventory', 'write'],
        ['staff', 'customers', 'read'],
        ['staff', 'customers', 'write'],
        ['staff', 'sales', 'read'],
        ['staff', 'sales', 'write']
    ];

    db.serialize(() => {
        const stmt = db.prepare("INSERT OR IGNORE INTO role_permissions (role, module, permission) VALUES (?, ?, ?)");
        defaultPermissions.forEach(p => stmt.run(p));
        stmt.finalize();
    });

    // Seed Initial Admin User if not exists
    db.get("SELECT * FROM users WHERE email = 'admin@erp.com'", [], async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Admin User', 'admin@erp.com', hashedPassword, 'admin']);
            console.log('Default Admin user created: admin@erp.com / admin123');
        }
    });
});

module.exports = db;
