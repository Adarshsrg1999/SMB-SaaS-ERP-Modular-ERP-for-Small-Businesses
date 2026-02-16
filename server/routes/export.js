const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

router.use(authenticateToken);

// Helper function to get data based on type
const getData = (type, callback) => {
    switch (type) {
        case 'sales':
            db.all(`
                SELECT sd.*, c.name as customer_name, c.email as customer_email
                FROM sales_documents sd
                LEFT JOIN customers c ON sd.customer_id = c.id
                ORDER BY sd.created_at DESC
            `, [], callback);
            break;
        case 'products':
            db.all(`
                SELECT p.*, c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.name
            `, [], callback);
            break;
        case 'customers':
            db.all('SELECT * FROM customers ORDER BY name', [], callback);
            break;
        case 'inventory':
            db.all(`
                SELECT il.*, p.name as product_name, p.sku
                FROM inventory_logs il
                LEFT JOIN products p ON il.product_id = p.id
                ORDER BY il.created_at DESC
            `, [], callback);
            break;
        default:
            callback(new Error('Invalid export type'));
    }
};

// Export to CSV
router.get('/csv/:type', checkPermission('sales', 'read'), (req, res) => {
    const { type } = req.params;

    getData(type, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_export_${timestamp}.csv`;
        const filepath = path.join(__dirname, '..', 'exports', filename);

        // Ensure exports directory exists
        const exportsDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Get headers from first row
        const headers = Object.keys(rows[0]).map(key => ({ id: key, title: key }));

        const csvWriter = createCsvWriter({
            path: filepath,
            header: headers
        });

        csvWriter.writeRecords(rows)
            .then(() => {
                res.download(filepath, filename, (err) => {
                    if (err) console.error('Download error:', err);
                    // Clean up file after download
                    setTimeout(() => {
                        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                    }, 5000);
                });
            })
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

// Export to Excel
router.get('/excel/:type', checkPermission('sales', 'read'), (req, res) => {
    const { type } = req.params;

    getData(type, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_export_${timestamp}.xlsx`;
        const filepath = path.join(__dirname, '..', 'exports', filename);

        // Ensure exports directory exists
        const exportsDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Create workbook and worksheet
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

        // Write file
        xlsx.writeFile(wb, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            // Clean up file after download
            setTimeout(() => {
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            }, 5000);
        });
    });
});

// Export to PDF
router.get('/pdf/:type', checkPermission('sales', 'read'), (req, res) => {
    const { type } = req.params;

    getData(type, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_export_${timestamp}.pdf`;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Title
        doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Export Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Table headers
        const headers = Object.keys(rows[0]);
        const colWidth = 500 / headers.length;

        doc.fontSize(9).font('Helvetica-Bold');
        let x = 50;
        headers.forEach(header => {
            doc.text(header, x, doc.y, { width: colWidth, continued: true });
            x += colWidth;
        });
        doc.text(''); // End continued text
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica').fontSize(8);
        rows.slice(0, 50).forEach(row => { // Limit to 50 rows for PDF
            x = 50;
            headers.forEach(header => {
                const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
                doc.text(value.substring(0, 30), x, doc.y, { width: colWidth, continued: true });
                x += colWidth;
            });
            doc.text(''); // End continued text
            doc.moveDown(0.3);

            // Add new page if needed
            if (doc.y > 700) {
                doc.addPage();
            }
        });

        if (rows.length > 50) {
            doc.moveDown();
            doc.fontSize(10).text(`Note: Showing first 50 of ${rows.length} records`, { align: 'center' });
        }

        doc.end();
    });
});

module.exports = router;
