import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '', manager_id: '' });
    const [users, setUsers] = useState([]);

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    useEffect(() => {
        Promise.all([fetchWarehouses(), fetchUsers()])
            .finally(() => setLoading(false));
    }, []);

    const fetchWarehouses = async () => {
        try {
            const res = await fetch('/api/warehouses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setWarehouses(await res.json());
        } catch (err) {
            addToast('Failed to load warehouses', 'error');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) {
            console.error('Failed to load users');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/warehouses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                addToast('Warehouse created successfully', 'success');
                setShowForm(false);
                setFormData({ name: '', location: '', manager_id: '' });
                fetchWarehouses();
            } else {
                const error = await res.json();
                addToast(error.error || 'Failed to create warehouse', 'error');
            }
        } catch (err) {
            addToast('Error creating warehouse', 'error');
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Warehouses</h3>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Warehouse'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-3">New Warehouse</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <Input
                                label="Warehouse Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Building A, Floor 2"
                            />
                            <div className="form-group">
                                <label>Manager</label>
                                <select
                                    value={formData.manager_id}
                                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        background: 'var(--surface)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    <option value="">Select Manager (Optional)</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button type="submit">Create Warehouse</Button>
                            <Button type="button" onClick={() => setShowForm(false)} style={{ background: 'var(--border)' }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {warehouses.map((warehouse, idx) => (
                    <div key={warehouse.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <h4>{warehouse.name}</h4>
                        {warehouse.location && (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                📍 {warehouse.location}
                            </p>
                        )}
                        {warehouse.manager_name && (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                                👤 Manager: {warehouse.manager_name}
                            </p>
                        )}
                        <div className="mt-3">
                            <Button
                                onClick={() => window.location.href = `/warehouses/${warehouse.id}/stock`}
                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', width: '100%' }}
                            >
                                View Stock
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {warehouses.length === 0 && !showForm && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <p style={{ color: 'var(--text-light)' }}>No warehouses yet. Click "Add Warehouse" to get started.</p>
                </div>
            )}
        </div>
    );
}
