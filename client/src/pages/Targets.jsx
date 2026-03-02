import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Targets() {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const [formData, setFormData] = useState({
        target_amount: '',
        period: 'monthly',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchTargets();
    }, []);

    const fetchTargets = async () => {
        try {
            const res = await fetch('/api/targets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const targetsData = await res.json();
                // Fetch progress for each target
                const targetsWithProgress = await Promise.all(
                    targetsData.map(async (target) => {
                        const progressRes = await fetch(`/api/targets/${target.id}/progress`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (progressRes.ok) {
                            return await progressRes.json();
                        }
                        return target;
                    })
                );
                setTargets(targetsWithProgress);
            }
        } catch {
            addToast('Failed to load targets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editingTarget ? `/api/targets/${editingTarget.id}` : '/api/targets';
        const method = editingTarget ? 'PUT' : 'POST';

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
                addToast(editingTarget ? 'Target updated' : 'Target created', 'success');
                setShowForm(false);
                setEditingTarget(null);
                resetForm();
                fetchTargets();
            }
        } catch {
            addToast('Failed to save target', 'error');
        }
    };

    const deleteTarget = async (id) => {
        if (!confirm('Delete this target?')) return;

        try {
            const res = await fetch(`/api/targets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                addToast('Target deleted', 'success');
                fetchTargets();
            }
        } catch {
            addToast('Failed to delete target', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            target_amount: '',
            period: 'monthly',
            start_date: '',
            end_date: ''
        });
    };

    const startEdit = (target) => {
        setEditingTarget(target);
        setFormData({
            target_amount: target.target_amount,
            period: target.period,
            start_date: target.start_date,
            end_date: target.end_date
        });
        setShowForm(true);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return '#10b981';
        if (percentage >= 75) return '#3b82f6';
        if (percentage >= 50) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>My Sales Targets</h3>
                <Button onClick={() => { setShowForm(!showForm); setEditingTarget(null); resetForm(); }}>
                    {showForm ? 'Cancel' : '+ New Target'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-down">
                    <h4>{editingTarget ? 'Edit Target' : 'Create New Target'}</h4>
                    <form onSubmit={handleSubmit}>
                        <Input
                            label="Target Amount ($)"
                            type="number"
                            step="0.01"
                            value={formData.target_amount}
                            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                            required
                        />

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Period
                            </label>
                            <select
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                style={{
                                    width: '100%',
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
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Start Date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />

                            <Input
                                label="End Date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit">{editingTarget ? 'Update Target' : 'Create Target'}</Button>
                            <Button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingTarget(null); resetForm(); }}
                                style={{ background: 'var(--surface)', color: 'var(--text)' }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {targets.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-light)' }}>No targets set. Create your first sales target!</p>
                    </div>
                ) : (
                    targets.map((target, idx) => {
                        const percentage = target.percentage || 0;
                        const progressColor = getProgressColor(percentage);

                        return (
                            <div
                                key={target.id}
                                className="card animate-slide-up"
                                style={{
                                    animationDelay: `${idx * 50}ms`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: 'var(--border)'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(percentage, 100)}%`,
                                        background: progressColor,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            background: 'var(--primary-light)',
                                            color: 'var(--primary)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {target.period}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '2rem' }}>🎯</div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: progressColor }}>
                                        {percentage}%
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                        ${(target.achieved || 0).toFixed(2)} of ${target.target_amount.toFixed(2)}
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--hover)',
                                    borderRadius: 'var(--radius)',
                                    height: '12px',
                                    overflow: 'hidden',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(percentage, 100)}%`,
                                        background: progressColor,
                                        transition: 'width 0.5s ease',
                                        borderRadius: 'var(--radius)'
                                    }} />
                                </div>

                                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                                    📅 {new Date(target.start_date).toLocaleDateString()} - {new Date(target.end_date).toLocaleDateString()}
                                </div>

                                {target.remaining > 0 && (
                                    <div style={{
                                        padding: '0.5rem',
                                        background: 'var(--hover)',
                                        borderRadius: 'var(--radius)',
                                        fontSize: '0.85rem',
                                        marginBottom: '1rem'
                                    }}>
                                        💪 ${target.remaining.toFixed(2)} remaining to reach goal
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        onClick={() => startEdit(target)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', flex: 1 }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => deleteTarget(target.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--danger)' }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
