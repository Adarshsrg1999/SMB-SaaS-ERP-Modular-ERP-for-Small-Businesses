const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { parseProductsCSV, parseCustomersCSV, bulkInsertProducts, bulkInsertCustomers } = require('../services/csvService');
const auditService = require('../services/auditService');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Preview Products CSV
router.post('/products/preview', checkPermission('inventory', 'write'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString('utf-8');
        const result = parseProductsCSV(csvText);

        res.json({
            totalRows: result.valid.length + result.errors.length,
            validRows: result.valid.length,
            errorRows: result.errors.length,
            preview: result.valid.slice(0, 10), // First 10 valid rows
            errors: result.errors.slice(0, 20) // First 20 errors
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Execute Products Import
router.post('/products/execute', checkPermission('inventory', 'write'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString('utf-8');
        const parseResult = parseProductsCSV(csvText);

        if (parseResult.valid.length === 0) {
            return res.status(400).json({ error: 'No valid rows to import' });
        }

        const insertResult = await bulkInsertProducts(parseResult.valid, req.user.id);

        // Audit log
        auditService.log(
            req.user.id,
            'CREATE',
            'bulk_import_products',
            null,
            {
                total: parseResult.valid.length,
                inserted: insertResult.inserted,
                failed: insertResult.failed
            },
            req.headers['x-forwarded-for'] || req.socket.remoteAddress
        );

        res.json({
            message: 'Import completed',
            inserted: insertResult.inserted,
            failed: insertResult.failed,
            failedItems: insertResult.failedItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Preview Customers CSV
router.post('/customers/preview', checkPermission('customers', 'write'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString('utf-8');
        const result = parseCustomersCSV(csvText);

        res.json({
            totalRows: result.valid.length + result.errors.length,
            validRows: result.valid.length,
            errorRows: result.errors.length,
            preview: result.valid.slice(0, 10),
            errors: result.errors.slice(0, 20)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Execute Customers Import
router.post('/customers/execute', checkPermission('customers', 'write'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString('utf-8');
        const parseResult = parseCustomersCSV(csvText);

        if (parseResult.valid.length === 0) {
            return res.status(400).json({ error: 'No valid rows to import' });
        }

        const insertResult = await bulkInsertCustomers(parseResult.valid, req.user.id);

        // Audit log
        auditService.log(
            req.user.id,
            'CREATE',
            'bulk_import_customers',
            null,
            {
                total: parseResult.valid.length,
                inserted: insertResult.inserted,
                failed: insertResult.failed
            },
            req.headers['x-forwarded-for'] || req.socket.remoteAddress
        );

        res.json({
            message: 'Import completed',
            inserted: insertResult.inserted,
            failed: insertResult.failed,
            failedItems: insertResult.failedItems
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
