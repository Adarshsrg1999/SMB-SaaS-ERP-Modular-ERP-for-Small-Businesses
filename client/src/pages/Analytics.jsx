import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [overallMargin, setOverallMargin] = useState(null);
    const [profitTrend, setProfitTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [period, setPeriod] = useState('daily');
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            // Fetch overall margin
            const marginRes = await fetch('/api/analytics/profit-margin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (marginRes.ok) {
                setOverallMargin(await marginRes.json());
            }

            // Fetch profit trend
            const trendRes = await fetch(`/api/analytics/profit-trend?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (trendRes.ok) {
                setProfitTrend(await trendRes.json());
            }

            // Fetch top products
            const productsRes = await fetch('/api/analytics/top-profitable-products?limit=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (productsRes.ok) {
                setTopProducts(await productsRes.json());
            }
        } catch {
            addToast('Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <h3 style={{ marginBottom: '2rem' }}>Profit Margin Analytics</h3>

            {/* Overall Metrics */}
            {overallMargin && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card animate-slide-up" style={{ animationDelay: '0ms' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                            Total Revenue
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            ${overallMargin.total_revenue.toFixed(2)}
                        </div>
                    </div>

                    <div className="card animate-slide-up" style={{ animationDelay: '50ms' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                            Total Cost
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            ${overallMargin.total_cost.toFixed(2)}
                        </div>
                    </div>

                    <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                            Total Profit
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                            ${overallMargin.total_profit.toFixed(2)}
                        </div>
                    </div>

                    <div className="card animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                            Profit Margin
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {overallMargin.profit_margin_percentage}%
                        </div>
                    </div>
                </div>
            )}

            {/* Profit Trend Chart */}
            <div className="card animate-slide-up" style={{ animationDelay: '200ms', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4>Profit Trend</h4>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--surface)',
                            color: 'var(--text)'
                        }}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                {profitTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={profitTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="period" stroke="var(--text-light)" />
                            <YAxis stroke="var(--text-light)" />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                            <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} name="Cost" />
                            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                        No data available for the selected period
                    </div>
                )}
            </div>

            {/* Top Profitable Products */}
            <div className="card animate-slide-up" style={{ animationDelay: '250ms' }}>
                <h4 style={{ marginBottom: '1rem' }}>Top 10 Profitable Products</h4>

                {topProducts.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topProducts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-light)" />
                                <YAxis stroke="var(--text-light)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="total_profit" fill="#10b981" name="Total Profit ($)" />
                            </BarChart>
                        </ResponsiveContainer>

                        <div style={{ marginTop: '2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>SKU</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Units Sold</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, idx) => (
                                        <tr
                                            key={product.id}
                                            style={{
                                                borderBottom: '1px solid var(--border)',
                                                background: idx % 2 === 0 ? 'transparent' : 'var(--hover)'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem' }}>{product.name}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>{product.sku}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{product.units_sold}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                                ${product.total_profit.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                        No product data available
                    </div>
                )}
            </div>
        </div>
    );
}
