import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AboutFacts from '@/features/core/components/about/AboutFacts';

vi.mock('@/features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <AboutFacts />
    </MemoryRouter>
  );
}

describe('AboutFacts section redesign', () => {
  it('renders the core headline and integrity disclosure', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /All four skills\. Two marked exactly, two estimated\./i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/Nothing here is a moderated IELTS result/i)).toBeInTheDocument();
  });

  it('renders all four skills as cards with their practice descriptions and scoring pills', () => {
    renderComponent();

    // Four skill cards
    expect(screen.getByRole('heading', { level: 3, name: 'Reading' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Listening' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Writing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Speaking' })).toBeInTheDocument();

    // Scoring methods
    expect(screen.getByText('Cambridge Answer Key')).toBeInTheDocument();
    expect(screen.getByText('Cambridge Audio Key')).toBeInTheDocument();
    expect(screen.getByText('4 Band Descriptors')).toBeInTheDocument();
    expect(screen.getByText('Acoustic + Descriptors')).toBeInTheDocument();

    // Exact and Estimated pills
    expect(screen.getAllByText('Exact').length).toBe(2);
    expect(screen.getAllByText('Estimated').length).toBe(2);

    // Feature tags
    expect(screen.getAllByText('Instant 40/40 marking').length).toBe(2);
    expect(screen.getByText('Criterion-by-criterion')).toBeInTheDocument();
    expect(screen.getByText('Acoustic & fluency AI')).toBeInTheDocument();
  });

  it('renders the free plan guarantee footnote', () => {
    renderComponent();

    expect(screen.getByText(/The free plan includes/i)).toBeInTheDocument();
    expect(
      screen.getByText(/unlimited Cambridge Reading and Listening practice/i)
    ).toBeInTheDocument();
  });

  it('renders within the full About page without crashing', async () => {
    const { HelmetProvider } = await import('react-helmet-async');
    const AboutPage = (await import('@/features/core/pages/About')).default;
    render(
      <HelmetProvider>
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /All four skills\. Two marked exactly, two estimated\./i,
      })
    ).toBeInTheDocument();
  });
});
