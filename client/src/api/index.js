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
