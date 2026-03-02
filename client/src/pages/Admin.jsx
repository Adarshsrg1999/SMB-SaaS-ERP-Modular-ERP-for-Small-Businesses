import React, { useState, useEffect } from 'react';
import { getSystemHealth, getAuditLogs, getSettings, updateSettings, resetDatabase } from '../api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('health');
    const [health, setHealth] = useState(null);
    const [logs, setLogs] = useState([]);
    const [settings, setSettings] = useState({
        businessName: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        logoUrl: '',
        taxId: ''
    });
    const [loading, setLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (activeTab === 'health') fetchHealth();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab]);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const data = await getSystemHealth();
            setHealth(data);
        } catch (err) {
            addToast('Failed to fetch health stats: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs(20);
            setLogs(data);
        } catch (err) {
            addToast('Failed to fetch logs: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (err) {
            addToast('Failed to fetch settings: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateSettings(settings);
            addToast('Settings updated successfully', 'success');
        } catch (err) {
            addToast('Update failed: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        try {
            await resetDatabase();
            addToast('Database reset successful', 'success');
            setShowResetModal(false);
        } catch (err) {
            addToast('Reset failed: ' + err.message, 'error');
        }
    };

    return (
        <div className="admin-container fade-in">
            <h1 className="mb-4">System Administration</h1>

            {/* Tabs Navigation */}
            <div className="flex gap-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                {['health', 'logs', 'settings', 'maintenance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn`}
                        style={{
                            borderRadius: '0',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                            backgroundColor: 'transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-light)',
                            boxShadow: 'none'
                        }}
                    >
                        {tab.charAt(0) + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading && activeTab !== 'maintenance' ? <Spinner /> : (
                <div className="animate-slide-up">
                    {/* Health Tab */}
                    {activeTab === 'health' && health && (
                        <div className="grid">
                            <div className="card">
                                <h4 className="mb-3">Server Stats</h4>
                                <p><strong>Platform:</strong> {health.platform}</p>
                                <p><strong>Node Version:</strong> {health.nodeVersion}</p>
                                <p><strong>Uptime:</strong> {Math.floor(health.uptime / 60)} minutes</p>
                            </div>
                            <div className="card">
                                <h4 className="mb-3">Memory Usage</h4>
                                <div className="mb-2" style={{ background: 'var(--border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{ width: `${health.memory.percentage}%`, height: '100%', background: 'var(--primary)' }}></div>
                                </div>
                                <p>Used: {health.memory.used} MB / Total: {health.memory.total} MB ({health.memory.percentage}%)</p>
                            </div>
                            <div className="card">
                                <h4 className="mb-3">Database</h4>
                                <p><strong>Size:</strong> {health.db.size} KB</p>
                                <p><strong>Location:</strong> {health.db.path}</p>
                            </div>
                        </div>
                    )}

                    {/* Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="card">
                            <h4 className="mb-3">Activity Audit Logs</h4>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Entity</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                                <td>{log.user_name || 'System'}</td>
                                                <td><span className={`badge badge-${log.action === 'DELETE' ? 'danger' : 'success'}`}>{log.action}</span></td>
                                                <td>{log.entity}</td>
                                                <td style={{ fontSize: '0.8rem' }}>{log.changes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="card" style={{ maxWidth: '800px' }}>
                            <h4 className="mb-3">Business Profile</h4>
                            <form onSubmit={handleSettingsSubmit} className="grid">
                                <Input label="Business Name" value={settings.businessName} onChange={e => setSettings({ ...settings, businessName: e.target.value })} />
                                <Input label="Tax ID / GSTIN" value={settings.taxId} onChange={e => setSettings({ ...settings, taxId: e.target.value })} />
                                <Input label="Contact Email" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} />
                                <Input label="Contact Phone" value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} />
                                <Input label="Logo URL" value={settings.logoUrl} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} />
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Address</label>
                                    <textarea
                                        className="form-control"
                                        style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--surface)', color: 'var(--text)' }}
                                        rows="3"
                                        value={settings.address}
                                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                                    ></textarea>
                                </div>
                                <Button type="submit" loading={loading}>Save Business Settings</Button>
                            </form>
                        </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === 'maintenance' && (
                        <div className="card" style={{ maxWidth: '600px' }}>
                            <h4 className="mb-3 text-danger">Danger Zone</h4>
                            <p className="mb-4">These actions can cause permanent data loss.</p>
                            <Button onClick={() => setShowResetModal(true)} variant="danger">Reset System Database</Button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleReset}
                title="Reset Database?"
                message="This will delete ALL data except Admin users. This action cannot be undone."
                confirmText="Reset Everything"
                confirmColor="var(--danger)"
            />
        </div>
    );
}
