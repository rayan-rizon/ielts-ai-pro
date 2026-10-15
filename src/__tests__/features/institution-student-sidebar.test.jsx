import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/features/core/components/Sidebar/UserSidebar';

const institution = {
  name: 'The Assam Kaziranga University',
  logo_url: 'https://example.com/institution.jpg',
};
const student = {
  full_name: 'Test Student',
  subscription_tier: 'pro',
  institution_branding: institution,
};

function renderSidebar(user = student, open = true) {
  return render(
    <MemoryRouter>
      <SidebarProvider open={open}>
        <Sidebar collapsible="icon">
          <UserSidebar user={user} location={{ pathname: '/dashboard' }} handleLogout={vi.fn()} />
        </Sidebar>
      </SidebarProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe('institution branding in the student sidebar', () => {
  it('uses the institution logo and attribution in the sidebar header', () => {
    renderSidebar();
    expect(screen.getByAltText(`${institution.name} logo`)).toHaveAttribute(
      'src',
      institution.logo_url
    );
    expect(screen.getByText('Powered by IELTS AI Pro')).toBeVisible();
    expect(
      screen.getByRole('link', { name: `${institution.name} dashboard — Powered by IELTS AI Pro` })
    ).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Dashboard', exact: true })).toBeInTheDocument();
  });

  it('keeps the institution logo in collapsed mode and attribution accessible', () => {
    renderSidebar(student, false);
    expect(screen.getByAltText(`${institution.name} logo`)).toBeInTheDocument();
    expect(screen.getByText('Powered by IELTS AI Pro').parentElement).toHaveClass('sr-only');
    expect(
      screen.getByRole('link', { name: `${institution.name} dashboard — Powered by IELTS AI Pro` })
    ).toHaveAttribute('title', `${institution.name} · Powered by IELTS AI Pro`);
  });

  it('retains the institution name and attribution if its image fails', () => {
    renderSidebar();
    fireEvent.error(screen.getByAltText(`${institution.name} logo`));
    expect(screen.queryByAltText(`${institution.name} logo`)).not.toBeInTheDocument();
    expect(screen.getByText(institution.name)).toBeVisible();
    expect(screen.getByText('Powered by IELTS AI Pro')).toBeVisible();
  });

  it('keeps the standard product branding for students without an institution', () => {
    renderSidebar({ ...student, institution_branding: null });
    expect(screen.queryByLabelText('Your institution')).not.toBeInTheDocument();
    expect(screen.queryByText('Powered by IELTS AI Pro')).not.toBeInTheDocument();
  });
});
