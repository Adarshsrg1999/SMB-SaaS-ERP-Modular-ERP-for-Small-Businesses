import React from 'react';

export default function Spinner({ size = 'md' }) {
    const sizeMap = {
        sm: '1.5rem',
        md: '2.5rem',
        lg: '4rem'
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <div style={{
                width: sizeMap[size],
                height: sizeMap[size],
                border: '4px solid var(--border)',
                borderTop: '4px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
