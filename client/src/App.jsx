import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import AccessDenied from './pages/AccessDenied';
import Users from './pages/Users';
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
        <AppContent user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppContent({ user, onLogin, onLogout }) {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login onLogin={onLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register onRegisterSuccess={() => { }} /> : <Navigate to="/" />} />
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
      </Routes>
    </Router>
  );
}

export default App;
