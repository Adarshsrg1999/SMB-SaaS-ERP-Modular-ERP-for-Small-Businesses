import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../pages/Login', () => ({
  default: ({ onLogin }) => (
    <div>
      <h1>Sign In</h1>
      <button onClick={() => onLogin({ id: 1, name: 'Test User', theme_preference: 'dark' }, 'fake-token')}>Sign In</button>
      <p>Don't have an account? <a href="/register">Register</a></p>
    </div>
  )
}));

vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));

import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to login page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows register link', () => {
    render(<App />);
    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
  });

  it('handleLogin stores token and user and renders dashboard', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(setItemSpy).toHaveBeenCalledWith('token', 'fake-token');
    expect(setItemSpy).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, name: 'Test User', theme_preference: 'dark' }));
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 1, name: 'Test User', theme_preference: 'dark' });
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(await screen.findByText(/Dashboard Page/i)).toBeInTheDocument();
  });
});