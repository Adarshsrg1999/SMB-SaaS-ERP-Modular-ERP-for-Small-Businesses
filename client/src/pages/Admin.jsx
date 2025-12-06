import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resetDatabase } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Admin() {
    const [showResetModal, setShowResetModal] = React.useState(false);

    const handleResetDatabase = async () => {
        try {
            await resetDatabase();
            alert('Database reset successful.');
            // reload or something
        } catch (err) {
            alert('Reset failed: ' + err.message);
        }
    };

    return (
        <div className="admin-container fade-in">
            <h1 style={{ marginBottom: '2rem' }}>Admin Administration</h1>

            <div className="card" style={{ maxWidth: '600px' }}>
                <h3 style={{ marginBottom: '1rem' }}>System Maintenance</h3>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
                    Dangerous actions for system maintenance. Please proceed with caution.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>Reset Database</h4>
                        <small style={{ color: 'var(--text-light)' }}>
                            Deletes all business data and non-admin users.
                        </small>
                    </div>
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="btn"
                        style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                    >
                        Reset Database
                    </button>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Other Features</h3>
                <p style={{ color: 'var(--text-light)' }}>
                    More administrative features (Audit Logs, System Settings, Backup) coming in future updates.
                </p>
            </div>

            <ConfirmationModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleResetDatabase}
                title="Reset Database?"
                message="This will delete ALL data (Customers, Sales, Inventory) and non-admin users. This action cannot be undone. Are you sure?"
                confirmText="Reset Everything"
                confirmColor="var(--danger)"
            />
        </div>
    );
}
