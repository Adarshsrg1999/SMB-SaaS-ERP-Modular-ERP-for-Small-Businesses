import React from 'react';

const statusConfig = {
    pending: { label: 'Pending', color: '#6b7280', bgColor: '#f3f4f6' },
    packed: { label: 'Packed', color: '#3b82f6', bgColor: '#dbeafe' },
    shipped: { label: 'Shipped', color: '#8b5cf6', bgColor: '#ede9fe' },
    delivered: { label: 'Delivered', color: '#10b981', bgColor: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2' }
};

export default function FulfillmentBadge({ status }) {
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span
            className="badge"
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
                fontWeight: '600',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}
        >
            {config.label}
        </span>
    );
}
