import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock_quantity: '' });

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch {
            addToast('Error fetching products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                addToast('Product added successfully', 'success');
                setShowForm(false);
                setFormData({ name: '', sku: '', price: '', stock_quantity: '' });
                fetchProducts();
            } else {
                addToast('Failed to add product', 'error');
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
                <h3>Inventory</h3>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Product'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <form onSubmit={handleSubmit} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Product Name *"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="SKU *"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            required
                        />
                        <Input
                            label="Price *"
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                        <Input
                            label="Initial Stock"
                            type="number"
                            value={formData.stock_quantity}
                            onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Button type="submit" isLoading={submitting}>
                                Save Product
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="card skeleton" style={{ height: '150px' }}></div>
                    ))
                ) : products.map((p, idx) => (
                    <div
                        key={p.id}
                        className="card flex flex-col justify-between animate-slide-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div>
                            <h4>{p.name}</h4>
                            <p className="text-muted" style={{ fontSize: '0.9rem' }}>SKU: {p.sku}</p>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>${p.price}</span>
                            <span className={`badge ${p.stock_quantity < p.min_stock_level ? 'badge-danger' : 'badge-success'}`}>
                                Stock: {p.stock_quantity}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
