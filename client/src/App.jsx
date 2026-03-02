import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import AccessDenied from './pages/AccessDenied';
import Users from './pages/Users';
import Admin from './pages/Admin';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import Warehouses from './pages/Warehouses';
import Notifications from './pages/Notifications';
import Tasks from './pages/Tasks';
import Targets from './pages/Targets';
import Analytics from './pages/Analytics';
import Export from './pages/Export';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppContent user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { useTheme } from './context/ThemeContext';

function AppContent({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const handleLoginSuccess = (userData, token) => {
    // Sync theme if preference exists (Story 31)
    if (userData.theme_preference) {
      setTheme(userData.theme_preference);
    }
    onLogin(userData, token);
    navigate('/');
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login onLogin={handleLoginSuccess} /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register onRegisterSuccess={() => navigate('/login')} /> : <Navigate to="/" />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Dashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Customers /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Inventory /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Sales /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <DashboardLayout user={user} onLogout={onLogout}><Users /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <DashboardLayout user={user} onLogout={onLogout}><Admin /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/vendors" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Vendors /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/purchase-orders" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><PurchaseOrders /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/warehouses" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Warehouses /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Notifications /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Tasks /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/targets" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Targets /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Analytics /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/export" element={
        <ProtectedRoute user={user}>
          <DashboardLayout user={user} onLogout={onLogout}><Export /></DashboardLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
