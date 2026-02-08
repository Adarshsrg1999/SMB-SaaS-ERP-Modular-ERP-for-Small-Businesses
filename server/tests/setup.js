const fs = require('fs');
const path = require('path');
const db = require('../database');

// Helper function to delete file with retry (for Windows file locking)
function deleteFileWithRetry(filePath, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️  Deleted old test database');
            }
            return;
        } catch (err) {
            if (i === maxRetries - 1) {
                console.warn(`Warning: Could not delete test database: ${err.message}`);
            }
        }
    }
}

// Delete test database before all tests
beforeAll(() => {
    const testDbPath = path.resolve(__dirname, '../erp.test.db');
    deleteFileWithRetry(testDbPath);
});

// Close database connection and delete test database after all tests
afterAll((done) => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }

        // Wait a bit for file handles to be released
        setTimeout(() => {
            const testDbPath = path.resolve(__dirname, '../erp.test.db');
            deleteFileWithRetry(testDbPath);
            done();
        }, 100);
    });
});
