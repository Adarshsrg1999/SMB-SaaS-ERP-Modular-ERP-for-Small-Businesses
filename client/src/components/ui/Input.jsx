import React from 'react';

export default function Input({
    label,
    error,
    className = '',
    id,
    ...props
}) {
    const inputId = id || props.name;

    return (
        <div className={`form-group ${className}`}>
            {label && <label htmlFor={inputId}>{label}</label>}
            <input
                id={inputId}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                {...props}
            />
            {error && <div className="invalid-feedback" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</div>}
        </div>
    );
}
