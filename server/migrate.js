const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'erp.db');
console.log("Opening database at:", dbPath);
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(products)", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    const columns = rows.map(r => r.name);
    console.log("Current columns in products:", columns);

    if (!columns.includes('category_id')) {
        console.log("Missing category_id, adding it...");
        db.run("ALTER TABLE products ADD COLUMN category_id INTEGER", (err) => {
            if (err) console.error("Error adding category_id:", err);
            else console.log("category_id added successfully.");

            checkCostPrice(columns);
        });
    } else {
        checkCostPrice(columns);
    }
});

function checkCostPrice(existingColumns) {
    if (!existingColumns.includes('cost_price')) {
        console.log("Missing cost_price, adding it...");
        db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0", (err) => {
            if (err) console.error("Error adding cost_price:", err);
            else console.log("cost_price added successfully.");
            checkSalesFields();
        });
    } else {
        checkSalesFields();
    }
}

function checkSalesFields() {
    db.all("PRAGMA table_info(sales_documents)", [], (err, rows) => {
        if (err) {
            console.error(err);
            db.close();
            return;
        }
        const columns = rows.map(r => r.name);
        console.log("Current columns in sales_documents:", columns);

        let tasks = [];
        if (!columns.includes('cost')) tasks.push("ALTER TABLE sales_documents ADD COLUMN cost REAL DEFAULT 0");
        if (!columns.includes('profit')) tasks.push("ALTER TABLE sales_documents ADD COLUMN profit REAL DEFAULT 0");

        if (tasks.length === 0) {
            console.log("All columns in sales_documents present.");
            db.close();
        } else {
            let completed = 0;
            tasks.forEach(task => {
                console.log("Running task:", task);
                db.run(task, (err) => {
                    if (err) console.error("Error running task:", err);
                    completed++;
                    if (completed === tasks.length) db.close();
                });
            });
        }
    });
}
