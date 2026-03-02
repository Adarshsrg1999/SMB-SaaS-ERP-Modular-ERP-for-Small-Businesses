import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', contact_person: '', email: '', phone: '',
        address: '', tax_id: '', payment_terms: '', rating: 0, notes: ''
    });

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setVendors(await res.json());
        } catch {
            addToast('Failed to load vendors', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/vendors/${editingId}` : '/api/vendors';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                addToast(`Vendor ${editingId ? 'updated' : 'created'} successfully`, 'success');
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    name: '', contact_person: '', email: '', phone: '',
                    address: '', tax_id: '', payment_terms: '', rating: 0, notes: ''
                });
                fetchVendors();
            } else {
                const error = await res.json();
                addToast(error.error || 'Failed to save vendor', 'error');
            }
        } catch {
            addToast('Error saving vendor', 'error');
        }
    };

    const handleEdit = (vendor) => {
        setFormData(vendor);
        setEditingId(vendor.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const res = await fetch(`/api/vendors/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                addToast('Vendor deleted successfully', 'success');
                fetchVendors();
            } else {
                addToast('Failed to delete vendor', 'error');
            }
        } catch {
            addToast('Error deleting vendor', 'error');
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Vendors</h3>
                <Button onClick={() => {
                    setShowForm(!showForm);
                    setEditingId(null);
                    setFormData({
                        name: '', contact_person: '', email: '', phone: '',
                        address: '', tax_id: '', payment_terms: '', rating: 0, notes: ''
                    });
                }}>
                    {showForm ? 'Cancel' : '+ Add Vendor'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-3">{editingId ? 'Edit' : 'New'} Vendor</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <Input
                                label="Vendor Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Contact Person"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Input
                                label="Phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                            <Input
                                label="Tax ID"
                                value={formData.tax_id}
                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                            />
                            <Input
                                label="Payment Terms"
                                value={formData.payment_terms}
                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                placeholder="e.g., Net 30"
                            />
                            <Input
                                label="Rating (0-5)"
                                type="number"
                                min="0"
                                max="5"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="mt-3">
                            <label>Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
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
                            <Button type="submit">{editingId ? 'Update' : 'Create'} Vendor</Button>
                            <Button type="button" onClick={() => setShowForm(false)} style={{ background: 'var(--border)' }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {vendors.map((vendor, idx) => (
                    <div key={vendor.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex justify-between items-start mb-2">
                            <h4>{vendor.name}</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {'⭐'.repeat(vendor.rating || 0)}
                            </div>
                        </div>
                        {vendor.contact_person && (
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Contact:</strong> {vendor.contact_person}
                            </p>
                        )}
                        {vendor.email && (
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Email:</strong> {vendor.email}
                            </p>
                        )}
                        {vendor.phone && (
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Phone:</strong> {vendor.phone}
                            </p>
                        )}
                        {vendor.payment_terms && (
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Terms:</strong> {vendor.payment_terms}
                            </p>
                        )}
                        <div className="flex gap-2 mt-3">
                            <Button onClick={() => handleEdit(vendor)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                Edit
                            </Button>
                            <Button
                                onClick={() => handleDelete(vendor.id)}
                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'var(--danger)' }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {vendors.length === 0 && !showForm && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <p style={{ color: 'var(--text-light)' }}>No vendors yet. Click "Add Vendor" to get started.</p>
                </div>
            )}
        </div>
    );
}
