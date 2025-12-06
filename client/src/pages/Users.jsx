import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

import '../styles/Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ID or 'BULK'
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'staff' });
        setEditingUserId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Leave empty to keep existing
            role: user.role
        });
        setEditingUserId(user.id);
        setShowForm(true);
        setError('');
        window.scrollTo(0, 0); // Scroll to top to see form
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingUserId) {
                await updateUser(editingUserId, formData);
            } else {
                await createUser(formData);
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedIds.size === users.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(users.map(u => u.id)));
        }
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Delete Logic
    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const handleBulkDeleteClick = () => {
        setConfirmDeleteId('BULK');
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;

        try {
            if (confirmDeleteId === 'BULK') {
                // Bulk Delete
                const idsToDelete = Array.from(selectedIds);
                await Promise.all(idsToDelete.map(id => deleteUser(id)));
                setSelectedIds(new Set());
            } else {
                // Single Delete
                await deleteUser(confirmDeleteId);
            }
            fetchUsers();
            setConfirmDeleteId(null);
        } catch (err) {
            setError(err.message || 'Failed to delete user(s)');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="users-container">
            <div className="users-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1>User Management</h1>
                    {selectedIds.size > 0 && (
                        <span className="selection-count">
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDeleteClick}
                            className="btn btn-delete"
                            style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}
                        >
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (showForm) resetForm();
                            else setShowForm(true);
                        }}
                        className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
                    >
                        {showForm ? 'Cancel' : 'Add New User'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="user-form-card animate-slide-up">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--accent)' }}>
                        {editingUserId ? 'Edit User' : 'Create New User'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                required
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Password {editingUserId && <span style={{ fontSize: '0.8em', color: '#666' }}>(Leave blank to keep current)</span>}
                            </label>
                            <input
                                type="password"
                                required={!editingUserId}
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, backgroundColor: 'var(--success)' }}
                            >
                                {editingUserId ? 'Update User' : 'Create User'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={resetForm}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={users.length > 0 && selectedIds.size === users.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="stagger-rows">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="skeleton" style={{ height: '50px' }}>
                                    <td colSpan="5"></td>
                                </tr>
                            ))
                        ) : users.map((user) => (
                            <tr key={user.id} className={selectedIds.has(user.id) ? 'row-selected' : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(user.id)}
                                        onChange={() => toggleSelect(user.id)}
                                    />
                                </td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="btn btn-secondary"
                                        style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(user.id)}
                                        className="btn-delete"
                                        title="Delete User"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title={confirmDeleteId === 'BULK' ? 'Delete Selected Users' : 'Delete User'}
                message={confirmDeleteId === 'BULK'
                    ? `Are you sure you want to delete ${selectedIds.size} users? This cannot be undone.`
                    : "Are you sure you want to delete this user? This action cannot be undone."}
                confirmText="Delete"
                confirmColor="var(--danger)"
            />
        </div>
    );
};

export default Users;
