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
        role TEXT DEFAULT 'staff' -- admin, manager, staff
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
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        description TEXT
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
