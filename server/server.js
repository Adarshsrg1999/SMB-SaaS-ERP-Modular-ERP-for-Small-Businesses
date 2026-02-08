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
const adminRoutes = require('./routes/admin');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const importRoutes = require('./routes/import');
const vendorsRoutes = require('./routes/vendors');
const purchaseOrdersRoutes = require('./routes/purchase-orders');
const warehousesRoutes = require('./routes/warehouses');
const transfersRoutes = require('./routes/transfers');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/transfers', transfersRoutes);

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
