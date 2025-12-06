import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;

    return (
        <button
            className={`${baseClass} ${variantClass} ${className}`}
            disabled={disabled || isLoading}
            style={{
                opacity: (disabled || isLoading) ? 0.7 : 1,
                cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
            }}
            {...props}
        >
            {isLoading && <span className="spinner-border spinner-border-sm" role="status" style={{
                width: '1em',
                height: '1em',
                border: '2px solid currentColor',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite'
            }}></span>}
            {children}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </button>
    );
}
