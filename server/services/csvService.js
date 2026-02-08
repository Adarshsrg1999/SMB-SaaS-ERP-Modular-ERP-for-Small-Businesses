const db = require('../database');

/**
 * CSV Service for parsing and validating CSV data
 */

const parseProductsCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'sku', 'price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const valid = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        // Validation
        const rowErrors = [];
        if (!row.name) rowErrors.push('Name is required');
        if (!row.sku) rowErrors.push('SKU is required');
        if (!row.price || isNaN(parseFloat(row.price))) rowErrors.push('Valid price is required');

        if (rowErrors.length > 0) {
            errors.push({
                line: i + 1,
                data: row,
                errors: rowErrors
            });
        } else {
            valid.push({
                name: row.name,
                sku: row.sku,
                price: parseFloat(row.price),
                stock_quantity: parseInt(row.stock_quantity || row.stock || 0),
                description: row.description || '',
                category_id: row.category_id ? parseInt(row.category_id) : null,
                min_stock_level: parseInt(row.min_stock_level || 5)
            });
        }
    }

    return { valid, errors };
};

const parseCustomersCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'email'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const valid = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        // Validation
        const rowErrors = [];
        if (!row.name) rowErrors.push('Name is required');
        if (!row.email) rowErrors.push('Email is required');
        if (row.email && !row.email.includes('@')) rowErrors.push('Invalid email format');

        if (rowErrors.length > 0) {
            errors.push({
                line: i + 1,
                data: row,
                errors: rowErrors
            });
        } else {
            valid.push({
                name: row.name,
                email: row.email,
                phone: row.phone || '',
                address: row.address || '',
                gst: row.gst || ''
            });
        }
    }

    return { valid, errors };
};

const bulkInsertProducts = (products, userId) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            "INSERT INTO products (name, sku, price, stock_quantity, description, category_id, min_stock_level) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );

        let inserted = 0;
        let failed = 0;
        const failedItems = [];

        products.forEach((product, index) => {
            stmt.run(
                [product.name, product.sku, product.price, product.stock_quantity, product.description, product.category_id, product.min_stock_level],
                function (err) {
                    if (err) {
                        failed++;
                        failedItems.push({ index: index + 1, product, error: err.message });
                    } else {
                        inserted++;
                    }
                }
            );
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve({ inserted, failed, failedItems });
        });
    });
};

const bulkInsertCustomers = (customers, userId) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            "INSERT INTO customers (name, email, phone, address, gst) VALUES (?, ?, ?, ?, ?)"
        );

        let inserted = 0;
        let failed = 0;
        const failedItems = [];

        customers.forEach((customer, index) => {
            stmt.run(
                [customer.name, customer.email, customer.phone, customer.address, customer.gst],
                function (err) {
                    if (err) {
                        failed++;
                        failedItems.push({ index: index + 1, customer, error: err.message });
                    } else {
                        inserted++;
                    }
                }
            );
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve({ inserted, failed, failedItems });
        });
    });
};

module.exports = {
    parseProductsCSV,
    parseCustomersCSV,
    bulkInsertProducts,
    bulkInsertCustomers
};
