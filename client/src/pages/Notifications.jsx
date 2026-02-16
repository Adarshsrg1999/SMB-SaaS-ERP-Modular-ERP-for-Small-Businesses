import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(await res.json());
            }
        } catch (err) {
            addToast('Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (err) {
            addToast('Failed to mark as read', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('All notifications marked as read', 'success');
                fetchNotifications();
            }
        } catch (err) {
            addToast('Failed to mark all as read', 'error');
        }
    };

    const deleteNotification = async (id) => {
        if (!confirm('Delete this notification?')) return;

        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast('Notification deleted', 'success');
                fetchNotifications();
            }
        } catch (err) {
            addToast('Failed to delete notification', 'error');
        }
    };

    const getTypeStyle = (type) => {
        const styles = {
            success: { bg: '#d1fae5', color: '#10b981', icon: '✅' },
            warning: { bg: '#fef3c7', color: '#f59e0b', icon: '⚠️' },
            error: { bg: '#fee2e2', color: '#ef4444', icon: '❌' },
            info: { bg: '#dbeafe', color: '#3b82f6', icon: 'ℹ️' }
        };
        return styles[type] || styles.info;
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    if (loading) return <Spinner />;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Notifications</h3>
                <div className="flex gap-2">
                    <Button onClick={markAllAsRead} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Mark All Read
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)',
                        border: filter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: filter === 'all' ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer'
                    }}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)',
                        border: filter === 'unread' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: filter === 'unread' ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer'
                    }}
                >
                    Unread ({notifications.filter(n => !n.is_read).length})
                </button>
                <button
                    onClick={() => setFilter('read')}
                    className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)',
                        border: filter === 'read' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: filter === 'read' ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer'
                    }}
                >
                    Read ({notifications.filter(n => n.is_read).length})
                </button>
            </div>

            <div className="card">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                        <p style={{ color: 'var(--text-light)' }}>No notifications</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif, idx) => {
                        const typeStyle = getTypeStyle(notif.type);
                        return (
                            <div
                                key={notif.id}
                                className="animate-slide-up"
                                style={{
                                    animationDelay: `${idx * 30}ms`,
                                    padding: '1rem',
                                    borderBottom: idx < filteredNotifications.length - 1 ? '1px solid var(--border)' : 'none',
                                    background: notif.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1.5rem',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        background: typeStyle.bg,
                                        flexShrink: 0
                                    }}
                                >
                                    {typeStyle.icon}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{notif.title}</h4>
                                        {!notif.is_read && (
                                            <span
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    background: 'var(--primary)',
                                                    borderRadius: '50%',
                                                    marginTop: '0.5rem'
                                                }}
                                            />
                                        )}
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)' }}>
                                        {notif.message}
                                    </p>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                                        {new Date(notif.created_at).toLocaleString()}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {!notif.is_read && (
                                            <Button
                                                onClick={() => markAsRead(notif.id)}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                                            >
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => deleteNotification(notif.id)}
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '0.3rem 0.7rem',
                                                background: 'var(--danger)'
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
