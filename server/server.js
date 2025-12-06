const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Legacy/Redirect Routes
app.get('/api/products', (req, res) => {
    res.redirect('/api/inventory');
});

// Root Route
app.get('/', (req, res) => {
    res.send('SMB SaaS ERP API is running');
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
