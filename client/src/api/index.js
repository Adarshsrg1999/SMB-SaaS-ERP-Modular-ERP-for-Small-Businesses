const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }
    return response.json();
};

export const register = async (name, email, password) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
    }
    return response.json();
};

export const getUsers = async () => {
    const response = await fetch('/api/users', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
    }
    return response.json();
};

export const createUser = async (userData) => {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
    }
    return response.json();
};

export const updateUser = async (id, userData) => {
    const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
    }
    return response.json();
};

export const deleteUser = async (id) => {
    const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
    }
    return response.json();
};

export const getDashboardMetrics = async () => {
    const response = await fetch('/api/dashboard/metrics', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dashboard metrics');
    }
    return response.json();
};

export const updateFulfillmentStatus = async (documentId, fulfillment_status, tracking_number = null) => {
    const response = await fetch(`/api/sales/${documentId}/fulfillment`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fulfillment_status, tracking_number }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update fulfillment status');
    }
    return response.json();
};

export const resetDatabase = async () => {
    const response = await fetch('/api/dashboard/reset', {
        method: 'POST',
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset database');
    }
    return response.json();
};

// Admin & System APIs
export const getSystemHealth = async () => {
    const response = await fetch('/api/admin/health', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch system health');
    }
    return response.json();
};

export const getAuditLogs = async (limit = 50, offset = 0) => {
    const response = await fetch(`/api/admin/audit-logs?limit=${limit}&offset=${offset}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch audit logs');
    }
    return response.json();
};

export const getSettings = async () => {
    const response = await fetch('/api/admin/settings', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch settings');
    }
    return response.json();
};

export const updateSettings = async (settings) => {
    const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
    }
    return response.json();
};

export const updateThemePreference = async (theme) => {
    const response = await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ theme }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update theme preference');
    }
    return response.json();
};

// Categories & Tags APIs (Story 27)
export const getCategories = async () => {
    const response = await fetch('/api/categories', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch categories');
    }
    return response.json();
};

export const createCategory = async (categoryData) => {
    const response = await fetch('/api/categories', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create category');
    }
    return response.json();
};

export const updateCategory = async (id, categoryData) => {
    const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update category');
    }
    return response.json();
};

export const deleteCategory = async (id) => {
    const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
    }
    return response.json();
};

export const getTags = async () => {
    const response = await fetch('/api/tags', {
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch tags');
    }
    return response.json();
};

export const createTag = async (tagData) => {
    const response = await fetch('/api/tags', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tagData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tag');
    }
    return response.json();
};

export const deleteTag = async (id) => {
    const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tag');
    }
    return response.json();
};
