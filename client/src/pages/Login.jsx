import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../api';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await login(email, password);
            onLogin(data.user, data.token);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="page-center">
            <div className="card auth-card">
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Sign In</h2>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
                </form>
                <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
