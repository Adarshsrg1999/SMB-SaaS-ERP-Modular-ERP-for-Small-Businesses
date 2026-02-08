import React, { useState, useEffect } from 'react';
import { getCategories } from '../api';

export default function CategorySelector({ value, onChange, allowNull = true }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories:', err);
        } finally {
            setLoading(false);
        }
    };

    // Build hierarchical display
    const buildHierarchy = (categories, parentId = null, level = 0) => {
        return categories
            .filter(cat => cat.parent_id === parentId)
            .flatMap(cat => [
                { ...cat, level },
                ...buildHierarchy(categories, cat.id, level + 1)
            ]);
    };

    const hierarchicalCategories = buildHierarchy(categories);

    if (loading) {
        return <select disabled><option>Loading...</option></select>;
    }

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
            style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)'
            }}
        >
            {allowNull && <option value="">-- No Category --</option>}
            {hierarchicalCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.level)}
                    {cat.name}
                    {cat.product_count > 0 && ` (${cat.product_count})`}
                </option>
            ))}
        </select>
    );
}
