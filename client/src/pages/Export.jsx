import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function Export() {
    const [exporting, setExporting] = useState(false);
    const { addToast } = useToast();
    const token = localStorage.getItem('token');

    const exportData = async (type, format) => {
        setExporting(true);
        try {
            const res = await fetch(`/api/export/${format}/${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                addToast(`${type} exported successfully`, 'success');
            } else {
                addToast('Export failed', 'error');
            }
        } catch (err) {
            addToast('Export failed', 'error');
        } finally {
            setExporting(false);
        }
    };

    const exportTypes = [
        { id: 'sales', name: 'Sales Documents', icon: '💰', description: 'Export all sales orders, invoices, and quotations' },
        { id: 'products', name: 'Products', icon: '📦', description: 'Export product catalog with pricing and inventory' },
        { id: 'customers', name: 'Customers', icon: '👥', description: 'Export customer contact information' },
        { id: 'inventory', name: 'Inventory Logs', icon: '📊', description: 'Export inventory movement history' }
    ];

    return (
        <div className="fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Advanced Data Export</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                Export your data in multiple formats for backup, analysis, or reporting purposes.
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {exportTypes.map((exportType, idx) => (
                    <div
                        key={exportType.id}
                        className="card animate-slide-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '3rem' }}>{exportType.icon}</div>

                            <div style={{ flex: 1 }}>
                                <h4 style={{ marginBottom: '0.5rem' }}>{exportType.name}</h4>
                                <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                                    {exportType.description}
                                </p>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Button
                                        onClick={() => exportData(exportType.id, 'csv')}
                                        disabled={exporting}
                                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                    >
                                        📄 Export CSV
                                    </Button>
                                    <Button
                                        onClick={() => exportData(exportType.id, 'excel')}
                                        disabled={exporting}
                                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#10b981' }}
                                    >
                                        📊 Export Excel
                                    </Button>
                                    <Button
                                        onClick={() => exportData(exportType.id, 'pdf')}
                                        disabled={exporting}
                                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#ef4444' }}
                                    >
                                        📕 Export PDF
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: '2rem', background: 'var(--hover)' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>📌 Export Notes</h4>
                <ul style={{ marginLeft: '1.5rem', color: 'var(--text-light)' }}>
                    <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
                    <li>Excel files (.xlsx) preserve formatting and are ideal for data analysis</li>
                    <li>PDF exports are limited to the first 50 records for readability</li>
                    <li>All exports include the current date in the filename</li>
                    <li>Exported files are automatically downloaded to your default download folder</li>
                </ul>
            </div>
        </div>
    );
}
