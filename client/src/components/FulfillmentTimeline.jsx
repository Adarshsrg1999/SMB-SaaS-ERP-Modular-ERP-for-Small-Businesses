import React from 'react';

export default function FulfillmentTimeline({ document }) {
    const steps = [
        {
            status: 'pending',
            label: 'Order Placed',
            timestamp: document.created_at,
            icon: '📝'
        },
        {
            status: 'packed',
            label: 'Packed',
            timestamp: document.packed_at,
            icon: '📦'
        },
        {
            status: 'shipped',
            label: 'Shipped',
            timestamp: document.shipped_at,
            icon: '🚚',
            extra: document.tracking_number ? `Tracking: ${document.tracking_number}` : null
        },
        {
            status: 'delivered',
            label: 'Delivered',
            timestamp: document.delivered_at,
            icon: '✅'
        }
    ];

    const currentStatusIndex = steps.findIndex(s => s.status === document.fulfillment_status);

    return (
        <div style={{ padding: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Fulfillment Timeline</h4>
            <div style={{ position: 'relative' }}>
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                        <div
                            key={step.status}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                marginBottom: index < steps.length - 1 ? '1.5rem' : '0',
                                position: 'relative'
                            }}
                        >
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '15px',
                                        top: '30px',
                                        width: '2px',
                                        height: '24px',
                                        backgroundColor: isCompleted ? 'var(--primary)' : 'var(--border)'
                                    }}
                                />
                            )}

                            {/* Icon Circle */}
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: isCompleted ? 'var(--primary)' : 'var(--border)',
                                    color: isCompleted ? 'white' : 'var(--text-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    flexShrink: 0,
                                    border: isCurrent ? '3px solid var(--primary-light)' : 'none',
                                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                                }}
                            >
                                {step.icon}
                            </div>

                            {/* Content */}
                            <div style={{ marginLeft: '1rem', flex: 1 }}>
                                <div style={{
                                    fontWeight: isCurrent ? '600' : '500',
                                    color: isCompleted ? 'var(--text)' : 'var(--text-light)'
                                }}>
                                    {step.label}
                                </div>
                                {step.timestamp && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-light)',
                                        marginTop: '0.25rem'
                                    }}>
                                        {new Date(step.timestamp).toLocaleString()}
                                    </div>
                                )}
                                {step.extra && isCompleted && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--primary)',
                                        marginTop: '0.25rem',
                                        fontWeight: '500'
                                    }}>
                                        {step.extra}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
