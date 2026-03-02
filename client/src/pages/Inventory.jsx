import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import CategorySelector from '../components/CategorySelector';
import TagInput from '../components/TagInput';
import { useToast } from '../context/ToastContext';

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '',
        category_id: null,
        tag_ids: []
    });
    const [filterCategory, setFilterCategory] = useState(null);
    const [filterTags, setFilterTags] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const fetchProducts = async () => {
        try {
            let url = '/api/inventory';
            const params = [];
            if (filterCategory) params.push(`category=${filterCategory}`);
            if (filterTags.length > 0) params.push(`tags=${filterTags.join(',')}`);
            if (params.length > 0) url += '?' + params.join('&');

            const res = await fetch(url, {
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

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!loading) return;
        fetchProducts();
    }, [filterCategory, filterTags]);

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock_quantity: product.stock_quantity,
            category_id: product.category_id,
            tag_ids: product.tags ? product.tags.map(t => t.id) : []
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Product deleted', 'success');
                fetchProducts();
            } else {
                addToast('Failed to delete product', 'error');
            }
        } catch {
            addToast('Error deleting product', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingId ? `/api/inventory/${editingId}` : '/api/inventory';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                addToast(editingId ? 'Product updated' : 'Product added', 'success');
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    name: '',
                    sku: '',
                    price: '',
                    stock_quantity: '',
                    category_id: null,
                    tag_ids: []
                });
                fetchProducts();
            } else {
                addToast('Failed to save product', 'error');
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
                <Button onClick={() => {
                    setShowForm(!showForm);
                    if (editingId) {
                        setEditingId(null);
                        setFormData({ name: '', sku: '', price: '', stock_quantity: '', category_id: null, tag_ids: [] });
                    }
                }}>
                    {showForm ? 'Cancel' : '+ Add Product'}
                </Button>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Filter by Category</label>
                        <CategorySelector
                            value={filterCategory}
                            onChange={(val) => {
                                setFilterCategory(val);
                                setLoading(true);
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Filter by Tags</label>
                        <TagInput
                            value={filterTags}
                            onChange={(val) => {
                                setFilterTags(val);
                                setLoading(true);
                            }}
                        />
                    </div>
                </div>
                {(filterCategory || filterTags.length > 0) && (
                    <Button
                        onClick={() => {
                            setFilterCategory(null);
                            setFilterTags([]);
                            setLoading(true);
                        }}
                        style={{ marginTop: '1rem' }}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h4>
                    <form onSubmit={handleSubmit} className="grid">
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category</label>
                            <CategorySelector
                                value={formData.category_id}
                                onChange={(val) => setFormData({ ...formData, category_id: val })}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags</label>
                            <TagInput
                                value={formData.tag_ids}
                                onChange={(val) => setFormData({ ...formData, tag_ids: val })}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Button type="submit" isLoading={submitting}>
                                {editingId ? 'Update Product' : 'Save Product'}
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
                            <div className="flex justify-between items-start">
                                <h4>{p.name}</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        title="Edit Product"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        title="Delete Product"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                SKU: {p.sku}
                            </p>
                            {p.category_name && (
                                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    <strong>Category:</strong> {p.category_name}
                                </p>
                            )}
                            {p.tags && p.tags.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {p.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="badge"
                                            style={{
                                                backgroundColor: '#3b82f6' + '20',
                                                color: '#3b82f6',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
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
        </div >
    );
}
