import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function PurchaseOrders() {
    const [orders, setOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        vendor_id: '',
        order_number: '',
        expected_delivery: '',
        notes: '',
        items: []
    });
    const [currentItem, setCurrentItem] = useState({ product_id: '', quantity: 1, unit_price: 0 });

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/purchase-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setOrders(await res.json());
        } catch {
            addToast('Failed to load purchase orders', 'error');
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setVendors(await res.json());
        } catch {
            console.error('Failed to load vendors');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setProducts(await res.json());
        } catch {
            console.error('Failed to load products');
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([fetchOrders(), fetchVendors(), fetchProducts()]);
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const addItem = () => {
        const product = products.find(p => p.id === parseInt(currentItem.product_id));
        if (!product) return;

        setFormData({
            ...formData,
            items: [...formData.items, {
                product_id: currentItem.product_id,
                product_name: product.name,
                quantity: currentItem.quantity,
                unit_price: currentItem.unit_price
            }]
        });
        setCurrentItem({ product_id: '', quantity: 1, unit_price: 0 });
    };

    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.items.length === 0) {
            addToast('Please add at least one item', 'error');
            return;
        }

        try {
            const res = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                addToast('Purchase order created successfully', 'success');
                setShowForm(false);
                setFormData({
                    vendor_id: '',
                    order_number: '',
                    expected_delivery: '',
                    notes: '',
                    items: []
                });
                fetchOrders();
            } else {
                const error = await res.json();
                addToast(error.error || 'Failed to create purchase order', 'error');
            }
        } catch {
            addToast('Error creating purchase order', 'error');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/purchase-orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                addToast('Status updated successfully', 'success');
                fetchOrders();
            } else {
                addToast('Failed to update status', 'error');
            }
        } catch {
            addToast('Error updating status', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: { bg: '#f3f4f6', color: '#6b7280' },
            ordered: { bg: '#dbeafe', color: '#3b82f6' },
            received: { bg: '#d1fae5', color: '#10b981' }
        };
        const config = colors[status] || colors.draft;

        return (
            <span
                className="badge"
                style={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: '600',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                }}
            >
                {status}
            </span>
        );
    };

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Purchase Orders</h3>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Create Purchase Order'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-3">New Purchase Order</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Vendor *</label>
                                <select
                                    value={formData.vendor_id}
                                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        background: 'var(--surface)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Order Number"
                                value={formData.order_number}
                                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                                placeholder="Optional"
                            />
                            <Input
                                label="Expected Delivery"
                                type="date"
                                value={formData.expected_delivery}
                                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                            />
                        </div>

                        <div className="mt-4">
                            <h5>Add Items</h5>
                            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                                <div className="form-group">
                                    <label>Product</label>
                                    <select
                                        value={currentItem.product_id}
                                        onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)',
                                            color: 'var(--text)'
                                        }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Quantity"
                                    type="number"
                                    min="1"
                                    value={currentItem.quantity}
                                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="Unit Price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={currentItem.unit_price}
                                    onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) })}
                                />
                                <Button type="button" onClick={addItem} style={{ marginBottom: '0.25rem' }}>
                                    Add
                                </Button>
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="mt-3">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Product</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Qty</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Price</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.5rem' }}>{item.product_name}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>${item.unit_price}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    ${(item.quantity * item.unit_price).toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>
                                                Total:
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>
                                                ${formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-3">
                            <label>Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="2"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    color: 'var(--text)'
                                }}
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button type="submit">Create Purchase Order</Button>
                            <Button type="button" onClick={() => setShowForm(false)} style={{ background: 'var(--border)' }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>PO #</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Vendor</th>
                            <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Expected</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem' }}>#{order.id}</td>
                                <td style={{ padding: '0.75rem' }}>{order.vendor_name}</td>
                                <td style={{ textAlign: 'right', padding: '0.75rem' }}>${order.total?.toFixed(2)}</td>
                                <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                    {getStatusBadge(order.status)}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    {order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                    {order.status === 'draft' && (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'ordered')}
                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Mark Ordered
                                        </Button>
                                    )}
                                    {order.status === 'ordered' && (
                                        <Button
                                            onClick={() => updateStatus(order.id, 'received')}
                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Mark Received
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {orders.length === 0 && (
                    <div className="text-center" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--text-light)' }}>No purchase orders yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
