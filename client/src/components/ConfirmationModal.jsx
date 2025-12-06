import React from 'react';
import '../styles/components.css'; // Assume modal styles are here or add inline

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'var(--danger)' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'var(--surface)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                maxWidth: '400px',
                width: '90%',
                boxShadow: 'var(--shadow-lg)',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text)' }}>{title}</h3>
                <p style={{ marginBottom: '2rem', color: 'var(--text)', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="btn"
                        style={{
                            backgroundColor: confirmColor,
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
