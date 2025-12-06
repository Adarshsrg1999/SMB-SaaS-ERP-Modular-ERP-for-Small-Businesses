import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container" style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`} style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
                        color: 'white',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '250px',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} style={{ color: 'white', marginLeft: '1rem', opacity: 0.8 }}>✕</button>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
