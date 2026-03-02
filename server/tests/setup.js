const fs = require('fs');
const path = require('path');
const db = require('../database');

// Helper function to delete file with retry (for Windows file locking)
async function deleteFileWithRetry(filePath, maxRetries = 5, delayMs = 200) {
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
            // wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

// Delete test database before all tests
beforeAll(async () => {
    const testDbPath = path.resolve(__dirname, '../erp.test.db');
    await deleteFileWithRetry(testDbPath);
});

// Close database connection and delete test database after all tests
afterAll(async () => {
    await new Promise((resolve) => db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
    }));

    // Wait a bit for file handles to be released
    await new Promise((resolve) => setTimeout(resolve, 300));

    const testDbPath = path.resolve(__dirname, '../erp.test.db');
    await deleteFileWithRetry(testDbPath);
});
