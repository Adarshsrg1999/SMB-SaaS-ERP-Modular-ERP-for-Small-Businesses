import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', gst: '' });
    const [errors, setErrors] = useState({});

    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            } else {
                addToast('Failed to fetch customers', 'error');
            }
        } catch {
            addToast('Network error fetching customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                addToast('Customer added successfully', 'success');
                setShowForm(false);
                setFormData({ name: '', email: '', phone: '', address: '', gst: '' });
                fetchCustomers();
            } else {
                addToast('Failed to add customer', 'error');
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
                <h3>Customer List</h3>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Customer'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-up">
                    <form onSubmit={handleSubmit} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Name *"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                        />
                        <Input
                            label="Phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            error={errors.phone}
                        />
                        <Input
                            label="GST No"
                            value={formData.gst}
                            onChange={e => setFormData({ ...formData, gst: e.target.value })}
                        />
                        <Input
                            label="Address"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="span-2" // Needs CSS for this or inline style
                            style={{ gridColumn: '1 / -1' }}
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Button type="submit" isLoading={submitting}>
                                Save Customer
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>GST</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="skeleton" style={{ height: '50px' }}>
                                    <td colSpan="4"></td>
                                </tr>
                            ))
                        ) : customers.length === 0 ? (
                            <tr className="animate-fade-in">
                                <td colSpan="4" className="text-center">No customers found</td>
                            </tr>
                        ) : (
                            <tbody className="stagger-rows">
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.email || '-'}</td>
                                        <td>{c.phone || '-'}</td>
                                        <td>{c.gst || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
