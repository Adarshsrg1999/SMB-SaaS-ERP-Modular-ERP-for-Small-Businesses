import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import './NotificationBell.css';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch {
            console.error('Failed to fetch unread count');
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.slice(0, 5)); // Show only 5 recent
            }
        } catch {
            addToast('Failed to load notifications', 'error');
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleBellClick = () => {
        if (!showDropdown) {
            fetchNotifications();
        }
        setShowDropdown(!showDropdown);
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUnreadCount();
                fetchNotifications();
            }
        } catch {
            console.error('Failed to mark as read');
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
                fetchUnreadCount();
                fetchNotifications();
            }
        } catch {
            addToast('Failed to mark all as read', 'error');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="notification-bell-container">
            <button className="notification-bell" onClick={handleBellClick}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="notification-overlay" onClick={() => setShowDropdown(false)} />
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h4>Notifications</h4>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="mark-all-read">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="no-notifications">
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    >
                                        <div className="notification-icon">{getTypeIcon(notif.type)}</div>
                                        <div className="notification-content">
                                            <div className="notification-title">{notif.title}</div>
                                            <div className="notification-message">{notif.message}</div>
                                            <div className="notification-time">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        {!notif.is_read && <div className="unread-dot" />}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="notification-footer">
                            <a href="/notifications">View all notifications</a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
