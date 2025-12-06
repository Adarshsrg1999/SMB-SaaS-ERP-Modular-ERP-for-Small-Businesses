import React, { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../api';

export default function Dashboard() {
    const [metrics, setMetrics] = useState({
        totalCustomers: 0,
        totalProducts: 0,
        salesToday: 0,
        salesWeek: 0,
        lowStockItems: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const data = await getDashboardMetrics();
            setMetrics(data);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Error: {error} <button onClick={fetchMetrics}>Retry</button></div>;

    return (
        <div className="dashboard-content-view">
            <div className="header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Business Overview</h2>
                <button
                    onClick={fetchMetrics}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Refresh Data
                </button>
            </div>

            <div className="grid">
                <div className="card animate-slide-up delay-100">
                    <h3>Total Sales (Today)</h3>
                    <p className="price">${metrics.salesToday.toLocaleString()}</p>
                    <span style={{ color: 'var(--success)' }}>Last 7 Days: ${metrics.salesWeek.toLocaleString()}</span>
                </div>
                <div className="card animate-slide-up delay-200">
                    <h3>Total Customers</h3>
                    <p className="price">{metrics.totalCustomers}</p>
                    <span style={{ color: 'var(--text-light)' }}>Active database records</span>
                </div>
                <div className="card animate-slide-up delay-300">
                    <h3>Total Products</h3>
                    <p className="price">{metrics.totalProducts}</p>
                    <span style={{ color: 'var(--text-light)' }}>Items in inventory</span>
                </div>
                <div className="card animate-slide-up delay-400">
                    <h3>Low Stock Alerts</h3>
                    <p className="price" style={{ color: metrics.lowStockItems.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {metrics.lowStockItems.length}
                    </p>
                    <span style={{ color: metrics.lowStockItems.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {metrics.lowStockItems.length > 0 ? 'Items need restock' : 'Stock levels healthy'}
                    </span>
                </div>
            </div>

            {metrics.lowStockItems.length > 0 && (
                <div className="section" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Low Stock Warnings</h3>
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Product Name</th>
                                    <th style={{ padding: '1rem' }}>SKU</th>
                                    <th style={{ padding: '1rem' }}>Current Stock</th>
                                    <th style={{ padding: '1rem' }}>Min Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.lowStockItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '1rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem' }}>{item.sku}</td>
                                        <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: 'bold' }}>{item.stock_quantity}</td>
                                        <td style={{ padding: '1rem' }}>{item.min_stock_level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
