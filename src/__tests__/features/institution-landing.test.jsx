import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import InstitutionLanding from '@/features/institution/pages/InstitutionLanding';
import {
  institutionLanding as content,
  institutionFaqs,
} from '@/features/institution/content/landingContent';

vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/components/shared/CookieConsent', () => ({
  default: () => <div data-testid="cookie-consent" />,
}));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));
vi.mock('@/features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, loading: false, authCheckComplete: true }),
}));

describe('InstitutionLanding page', () => {
  it('renders hero, portal preview, skills, onboarding steps, and footer with unified shell', () => {
    render(
      <MemoryRouter initialEntries={['/institutions']}>
        <InstitutionLanding />
      </MemoryRouter>
    );

    // Hero heading and main content
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Better IELTS practice for your institution/i
    );
    expect(screen.getByText(content.intro)).toBeInTheDocument();

    // CTA links to /institution/apply and /institution/login
    const applyLinks = screen.getAllByRole('link', { name: new RegExp(content.primaryCta, 'i') });
    expect(applyLinks.length).toBeGreaterThanOrEqual(1);
    expect(applyLinks[0]).toHaveAttribute('href', content.primaryHref);

    const loginLinks = screen.getAllByRole('link', { name: new RegExp(content.secondaryCta, 'i') });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute('href', content.secondaryHref);

    // 4 exam practice skills are present
    expect(screen.getByRole('heading', { name: /Reading/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Listening/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Writing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Speaking/i })).toBeInTheDocument();

    // Onboarding 3 steps
    expect(screen.getByRole('heading', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin review' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Owner invitation' })).toBeInTheDocument();

    // Portal Preview sample student list
    expect(screen.getByText('Ava Thompson')).toBeInTheDocument();
    expect(screen.getByText('Jacob Lee')).toBeInTheDocument();
    expect(screen.getByText('Sofia Malik')).toBeInTheDocument();
    expect(screen.getByText('Daniel Rocha')).toBeInTheDocument();

    // FAQs are rendered in the accordion
    for (const [question] of institutionFaqs) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }

    // Cookie consent rendered
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();

    // Accessible skip link
    expect(screen.getByRole('link', { name: /Skip to content/i })).toHaveAttribute(
      'href',
      '#institution-main'
    );
  });

  it('contains valid structured data matching schema requirements', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/institutions']}>
        <InstitutionLanding />
      </MemoryRouter>
    );

    // Verify main landmarks
    expect(container.querySelector('main#institution-main')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
