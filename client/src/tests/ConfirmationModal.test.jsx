import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ConfirmationModal from '../components/ConfirmationModal';

describe('ConfirmationModal', () => {
  test('renders nothing when isOpen is false', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Hidden"
        message="Should not show"
      />
    );
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.queryByText('Should not show')).toBeNull();
  });

  test('renders title, message and default buttons when open', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Title"
        message="Confirm message"
      />
    );
    expect(screen.getByText('Confirm Title')).toBeTruthy();
    expect(screen.getByText('Confirm message')).toBeTruthy();
    const cancelBtn = screen.getByText('Cancel');
    const confirmBtn = screen.getByText('Confirm');
    expect(cancelBtn).toBeTruthy();
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn.style.backgroundColor).toBe('var(--danger)');
  });

  test('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        message="M"
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('calls onConfirm then onClose when Confirm clicked', () => {
    const seq = [];
    const onConfirm = vi.fn(() => seq.push('confirm'));
    const onClose = vi.fn(() => seq.push('close'));
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        message="M"
      />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(seq).toEqual(['confirm', 'close']);
  });

  test('uses custom confirmText and confirmColor', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Custom"
        message="Custom message"
        confirmText="Delete"
        confirmColor="red"
      />
    );
    const customBtn = screen.getByText('Delete');
    expect(customBtn).toBeTruthy();
    expect(customBtn.style.backgroundColor).toBe('red');
  });
});