import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'completed'
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        related_to: 'general',
        related_id: null
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTasks(await res.json());
            }
        } catch {
            addToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
        const method = editingTask ? 'PUT' : 'POST';

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
                addToast(editingTask ? 'Task updated' : 'Task created', 'success');
                setShowForm(false);
                setEditingTask(null);
                resetForm();
                fetchTasks();
            }
        } catch {
            addToast('Failed to save task', 'error');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/tasks/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                addToast('Task status updated', 'success');
                fetchTasks();
            }
        } catch {
            addToast('Failed to update status', 'error');
        }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return;

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                addToast('Task deleted', 'success');
                fetchTasks();
            }
        } catch {
            addToast('Failed to delete task', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            due_date: '',
            related_to: 'general',
            related_id: null
        });
    };

    const startEdit = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            due_date: task.due_date || '',
            related_to: task.related_to || 'general',
            related_id: task.related_id
        });
        setShowForm(true);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#6b7280',
            in_progress: '#3b82f6',
            completed: '#10b981'
        };
        return colors[status] || colors.pending;
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Task Management</h3>
                <Button onClick={() => { setShowForm(!showForm); setEditingTask(null); resetForm(); }}>
                    {showForm ? 'Cancel' : '+ New Task'}
                </Button>
            </div>

            {showForm && (
                <div className="card mb-4 animate-slide-down">
                    <h4>{editingTask ? 'Edit Task' : 'Create New Task'}</h4>
                    <form onSubmit={handleSubmit}>
                        <Input
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--surface)',
                                    color: 'var(--text)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        background: 'var(--surface)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <Input
                                label="Due Date"
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit">{editingTask ? 'Update Task' : 'Create Task'}</Button>
                            <Button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingTask(null); resetForm(); }}
                                style={{ background: 'var(--surface)', color: 'var(--text)' }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex gap-2 mb-4">
                {['all', 'pending', 'in_progress', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            border: filter === status ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: filter === status ? 'var(--primary-light)' : 'var(--surface)',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {status.replace('_', ' ')} ({tasks.filter(t => status === 'all' || t.status === status).length})
                    </button>
                ))}
            </div>

            <div className="card">
                {filteredTasks.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                        <p style={{ color: 'var(--text-light)' }}>No tasks found</p>
                    </div>
                ) : (
                    filteredTasks.map((task, idx) => (
                        <div
                            key={task.id}
                            className="animate-slide-up"
                            style={{
                                animationDelay: `${idx * 30}ms`,
                                padding: '1rem',
                                borderBottom: idx < filteredTasks.length - 1 ? '1px solid var(--border)' : 'none',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'flex-start'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => updateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                                style={{ marginTop: '0.25rem', cursor: 'pointer', width: '18px', height: '18px' }}
                            />

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{
                                        margin: 0,
                                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                        opacity: task.status === 'completed' ? 0.6 : 1
                                    }}>
                                        {task.title}
                                    </h4>
                                    <span
                                        style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: getPriorityColor(task.priority) + '20',
                                            color: getPriorityColor(task.priority)
                                        }}
                                    >
                                        {task.priority}
                                    </span>
                                    <span
                                        style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: getStatusColor(task.status) + '20',
                                            color: getStatusColor(task.status)
                                        }}
                                    >
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {task.description && (
                                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)' }}>
                                        {task.description}
                                    </p>
                                )}

                                {task.due_date && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                                        📅 Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {task.status !== 'completed' && (
                                        <>
                                            <Button
                                                onClick={() => updateStatus(task.id, task.status === 'in_progress' ? 'pending' : 'in_progress')}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                                            >
                                                {task.status === 'in_progress' ? 'Mark Pending' : 'Start'}
                                            </Button>
                                            <Button
                                                onClick={() => startEdit(task)}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', background: 'var(--surface)', color: 'var(--text)' }}
                                            >
                                                Edit
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={() => deleteTask(task.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', background: 'var(--danger)' }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
