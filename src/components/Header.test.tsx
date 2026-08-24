import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { UserProfile } from '../types';

describe('Header Component', () => {
  const mockUser: UserProfile = {
    uid: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    username: 'John Doe',
    createdAt: Date.now(),
    isFirebaseUser: true
  };

  const defaultProps = {
    activeTab: 'landing' as const,
    setActiveTab: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    user: mockUser,
    soundOn: true,
    setSoundOn: vi.fn(),
    onOpenAuthModal: vi.fn(),
  };

  it('renders correctly with user', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getAllByAltText('Qnigame')[0]).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders login button when no user', () => {
    render(<Header {...defaultProps} user={null} />);
    expect(screen.getAllByText(/התחברות/i)[0]).toBeInTheDocument();
  });

  it('calls onOpenAuthModal when login button is clicked', () => {
    render(<Header {...defaultProps} user={null} />);
    const loginButton = screen.getAllByRole('button', { name: /התחברות/i })[0];
    fireEvent.click(loginButton);
    expect(defaultProps.onOpenAuthModal).toHaveBeenCalled();
  });
});
