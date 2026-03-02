import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Sales() {
    const [documents, setDocuments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Simple form state for creating a document
    const [formData, setFormData] = useState({ customer_id: '', type: 'quotation', items: [] });
    const [currentItem, setCurrentItem] = useState({ product_id: '', quantity: 1 });
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(false);

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/sales', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setDocuments(await res.json());
            else addToast('Failed to load documents', 'error');
        } catch {
            addToast('Error fetching documents', 'error');
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setCustomers(await res.json());
            else addToast('Failed to load customers', 'error');
        } catch {
            addToast('Error fetching customers', 'error');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/inventory', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setProducts(await res.json());
            else addToast('Failed to load products', 'error');
        } catch {
            addToast('Error fetching products', 'error');
        }
    };

    useEffect(() => {
        Promise.all([fetchDocuments(), fetchCustomers(), fetchProducts()])
            .finally(() => setLoading(false));
    }, []);

    const addItem = () => {
        const product = products.find(p => p.id === parseInt(currentItem.product_id));
        if (!product) return;

        setFormData({
            ...formData,
            items: [...formData.items, { ...currentItem, price: product.price, name: product.name, sku: product.sku }]
        });
        setCurrentItem({ product_id: '', quantity: 1 });
    };

    const removeItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleViewDetails = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedDoc(data);
                setViewingDetails(true);
                setShowForm(false);
            } else {
                addToast('Failed to load document details', 'error');
            }
        } catch {
            addToast('Error fetching document details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDoc = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            const res = await fetch(`/api/sales/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Document deleted', 'success');
                fetchDocuments();
                if (selectedDoc && selectedDoc.id === id) {
                    setViewingDetails(false);
                    setSelectedDoc(null);
                }
            } else {
                addToast('Failed to delete document', 'error');
            }
        } catch {
            addToast('Error deleting document', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                addToast(`${formData.type} created successfully`, 'success');
                setShowForm(false);
                setFormData({ customer_id: '', type: 'quotation', items: [] });
                fetchDocuments();
            } else {
                addToast('Failed to create document', 'error');
            }
        } catch {
            addToast('Error submitting form', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Sales & Orders</h3>
                <Button onClick={() => {
                    setShowForm(!showForm);
                    setViewingDetails(false);
                }}>
                    {showForm ? 'Cancel' : '+ Create Document'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-3">New {formData.type}</h4>
                    <div className="grid">
                        <div className="grid">
                            <div className="form-group">
                                <label>Document Type</label>
                                <select
                                    className="form-control" // Assuming basic styling for now, ideally Reusable Select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
                                >
                                    <option value="quotation">Quotation</option>
                                    <option value="order">Order</option>
                                    <option value="invoice">Invoice</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Customer</label>
                                <select
                                    className="form-control"
                                    value={formData.customer_id}
                                    onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="card" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem' }}>
                            <h5 className="mb-2">Add Items</h5>
                            <div className="flex gap-2 items-end">
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.875rem' }}>Product</label>
                                    <select
                                        className="form-control"
                                        value={currentItem.product_id}
                                        onChange={e => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                                    </select>
                                </div>
                                <div style={{ width: '100px' }}>
                                    <Input
                                        label="Qty"
                                        type="number"
                                        min="1"
                                        value={currentItem.quantity}
                                        onChange={e => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <Button variant="outline" onClick={addItem} type="button" style={{ marginBottom: '1px' }}>Add</Button>
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <ul style={{ listStyle: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                {formData.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between p-3 border-b animate-slide-up" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                                        <div className="flex flex-col">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>SKU: {item.sku}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold">${item.price * item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                                title="Remove Item"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={formData.items.length === 0 || !formData.customer_id}
                            isLoading={submitting}
                        >
                            Create {formData.type}
                        </Button>
                    </div>
                </div>
            )}

            {viewingDetails && selectedDoc ? (
                <div className="card animate-slide-up">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b">
                        <div>
                            <Button onClick={() => setViewingDetails(false)} variant="ghost" style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
                                ← Back to list
                            </Button>
                            <h4 className="flex items-center gap-2">
                                <span style={{ textTransform: 'capitalize' }}>{selectedDoc.type}</span> #{selectedDoc.id}
                            </h4>
                            <p style={{ color: 'var(--text-light)' }}>{new Date(selectedDoc.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`badge ${selectedDoc.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {selectedDoc.status.toUpperCase()}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.print()}>Print</Button>
                                <Button variant="danger" onClick={() => handleDeleteDoc(selectedDoc.id)}>Delete</Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <h5 className="mb-2 text-primary">Customer Details</h5>
                            <p><strong>Name:</strong> {selectedDoc.customer_name}</p>
                            <p><strong>Email:</strong> {selectedDoc.customer_email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedDoc.customer_phone || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <h5 className="mb-2 text-primary">Financial Summary</h5>
                            <p><strong>Total Amount:</strong> ${selectedDoc.total.toFixed(2)}</p>
                            {selectedDoc.profit !== undefined && (
                                <p><strong>Estimated Profit:</strong> ${selectedDoc.profit.toFixed(2)}</p>
                            )}
                        </div>
                    </div>

                    <h5 className="mb-3">Items</h5>
                    <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <table style={{ margin: 0 }}>
                            <thead style={{ backgroundColor: 'var(--card-bg-alt)' }}>
                                <tr>
                                    <th>SKU</th>
                                    <th>Product</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-right">Unit Price</th>
                                    <th className="text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedDoc.items && selectedDoc.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.product_sku}</td>
                                        <td>{item.product_name}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">${item.price.toFixed(2)}</td>
                                        <td className="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ borderTop: '2px solid var(--border)' }}>
                                <tr>
                                    <td colSpan="4" className="text-right font-bold" style={{ padding: '1rem' }}>GRAND TOTAL</td>
                                    <td className="text-right font-bold" style={{ padding: '1rem', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                        ${selectedDoc.total.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th className="text-right">Total</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="stagger-rows">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="skeleton" style={{ height: '50px' }}>
                                        <td colSpan="7"></td>
                                    </tr>
                                ))
                            ) : documents.length === 0 ? (
                                <tr className="animate-fade-in"><td colSpan="7" className="text-center">No documents found</td></tr>
                            ) : (
                                documents.map(d => (
                                    <tr key={d.id}>
                                        <td>#{d.id}</td>
                                        <td>{new Date(d.created_at).toLocaleDateString()}</td>
                                        <td>{d.customer_name}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{d.type}</td>
                                        <td>
                                            <span className={`badge ${d.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="font-bold text-right">${d.total.toFixed(2)}</td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(d.id)}
                                                    title="View Details"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDoc(d.id)}
                                                    title="Delete Document"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
