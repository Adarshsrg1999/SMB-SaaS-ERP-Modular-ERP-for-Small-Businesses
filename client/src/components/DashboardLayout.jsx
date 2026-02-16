import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import '../styles/layout.css';

export default function DashboardLayout({ children, user, onLogout }) {
    // const navigate = useNavigate(); // Unused

    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/customers', label: 'Customers', icon: '👥' },
        { path: '/inventory', label: 'Inventory', icon: '📦' },
        { path: '/sales', label: 'Sales & Orders', icon: '💰' },
        { path: '/vendors', label: 'Vendors', icon: '🏭' },
        { path: '/purchase-orders', label: 'Purchase Orders', icon: '📋' },
        { path: '/warehouses', label: 'Warehouses', icon: '🏢' },
        { path: '/targets', label: 'My Targets', icon: '🎯' },
        { path: '/tasks', label: 'Tasks', icon: '✅' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
        { path: '/notifications', label: 'Notifications', icon: '🔔' },
    ];

    if (user?.role === 'admin') {
        menuItems.push({ path: '/users', label: 'Users', icon: '👤' });
        menuItems.push({ path: '/export', label: 'Export Data', icon: '💾' });
        menuItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
    }

    const currentPath = location.pathname;
    const currentItem = menuItems.find(i => i.path === currentPath);
    const title = currentItem?.label || 'ERP';

    // Breadcrumbs Logic (Simple version for now)
    const getBreadcrumbs = () => {
        const parts = currentPath.split('/').filter(Boolean);
        if (parts.length === 0) return 'Home';
        return `Home > ${parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ')}`;
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span>🚀</span> SMB ERP
                </div>

                <nav className="nav-list">
                    {menuItems.map((item) => (
                        <div key={item.path} className="nav-item">
                            <Link
                                to={item.path}
                                className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        Logged in as: <strong>{user?.name}</strong>
                        <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({user?.role})</span>
                    </div>
                    <button onClick={onLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                        <button
                            className="mobile-toggle"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            ☰
                        </button>
                        <div>
                            <h2 className="page-title">{title}</h2>
                            <div className="breadcrumbs">{getBreadcrumbs()}</div>
                        </div>
                    </div>

                    <div className="header-right">
                        <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </button>
                        <NotificationBell />
                    </div>
                </header>

                <div className="content-area">
                    {children}
                </div>
            </main>
        </div>
    );
}
