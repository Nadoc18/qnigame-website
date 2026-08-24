import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage Component', () => {
  const defaultProps = {
    games: [],
    news: [],
    user: null,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    selectedCategory: 'all' as const,
    setSelectedCategory: vi.fn(),
    onSelectGame: vi.fn(),
    onToggleFavorite: vi.fn(),
    onOpenNews: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading spinner when games array is empty', () => {
    render(<LandingPage {...defaultProps} games={[]} />);
    expect(screen.getByText('טוען משחקים מהשרת...')).toBeInTheDocument();
  });

  it('renders games when games array is populated', () => {
    const mockGames = [
      {
        id: 'game1',
        title: 'Test Game 1',
        description: 'Test Description',
        category: 'halacha' as const,
        imageUrl: '/test.jpg',
        isNew: false,
        isPopular: true,
        isHtml5: false,
        webglBuildUrl: '/build',
        webglLoaderUrl: '/loader',
        webglDataUrl: '/data',
        webglFrameworkUrl: '/framework'
      }
    ];

    render(<LandingPage {...defaultProps} games={mockGames} />);
    
    // Fallback loading should NOT be there
    expect(screen.queryByText('טוען משחקים מהשרת...')).not.toBeInTheDocument();
    
    // Featured game title should be visible
    expect(screen.getByText('Test Game 1')).toBeInTheDocument();
  });
});
