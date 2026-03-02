import React, { useState, useEffect } from 'react';
import { getTags, createTag } from '../api';

export default function TagInput({ value = [], onChange }) {
    const [tags, setTags] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchTags = async () => {
        try {
            const data = await getTags();
            setTags(data);
        } catch {
            console.error('Failed to load tags');
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const selectedTags = tags.filter(tag => value.includes(tag.id));
    const filteredSuggestions = tags.filter(tag =>
        !value.includes(tag.id) &&
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleAddTag = async (tagId) => {
        if (!value.includes(tagId)) {
            onChange([...value, tagId]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const handleCreateTag = async () => {
        if (!inputValue.trim()) return;

        try {
            const newTag = await createTag({ name: inputValue.trim() });
            setTags([...tags, newTag]);
            onChange([...value, newTag.id]);
            setInputValue('');
            setShowSuggestions(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRemoveTag = (tagId) => {
        onChange(value.filter(id => id !== tagId));
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Selected Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {selectedTags.map(tag => (
                    <span
                        key={tag.id}
                        className="badge"
                        style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem'
                        }}
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: tag.color,
                                cursor: 'pointer',
                                padding: '0',
                                marginLeft: '0.25rem'
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            {/* Input */}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type to search or create tags..."
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)'
                }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (inputValue || filteredSuggestions.length > 0) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        marginTop: '0.25rem',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    {filteredSuggestions.map(tag => (
                        <div
                            key={tag.id}
                            onClick={() => handleAddTag(tag.id)}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--border)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <span
                                className="badge"
                                style={{
                                    backgroundColor: tag.color + '20',
                                    color: tag.color
                                }}
                            >
                                {tag.name}
                            </span>
                        </div>
                    ))}
                    {inputValue && !tags.find(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                        <div
                            onClick={handleCreateTag}
                            style={{
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontStyle: 'italic',
                                color: 'var(--primary)'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--border)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            + Create "{inputValue}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
