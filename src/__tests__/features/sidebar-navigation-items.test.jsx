import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/features/core/components/Sidebar/UserSidebar';
import { learningToolsItems } from '@/features/core/components/Sidebar/navigationItems';
import { ReiconTarget } from '@/components/icons/ReiconTarget';

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe('Sidebar Learning Tools Navigation Items', () => {
  it('assigns distinct icons to Grammar Lab and Practice Lab', () => {
    const grammarItem = learningToolsItems.find((item) => item.title === 'Grammar Lab');
    const practiceItem = learningToolsItems.find((item) => item.title === 'Practice Lab');

    expect(grammarItem).toBeDefined();
    expect(practiceItem).toBeDefined();
    expect(grammarItem.icon).not.toBe(practiceItem.icon);
    expect(practiceItem.icon).toBe(ReiconTarget);
  });

  it('keeps the toured learning tools together in the sidebar', () => {
    expect(learningToolsItems.slice(0, 3).map((item) => item.title)).toEqual([
      'Grammar Lab',
      'Practice Lab',
      'Resources',
    ]);
  });

  it('renders ReiconTarget with correct SVG attributes', () => {
    const { container } = render(<ReiconTarget className="h-4 w-4 text-blue-500" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeDefined();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.classList.contains('h-4')).toBe(true);
    expect(svg.classList.contains('w-4')).toBe(true);
  });

  it('does not display an AI badge on Practice Lab in the sidebar', () => {
    render(
      <MemoryRouter>
        <SidebarProvider open={true}>
          <Sidebar collapsible="icon">
            <UserSidebar
              user={{ full_name: 'Test Student', subscription_tier: 'pro' }}
              location={{ pathname: '/dashboard' }}
              handleLogout={vi.fn()}
            />
          </Sidebar>
        </SidebarProvider>
      </MemoryRouter>
    );

    const practiceLink = screen.getByRole('link', { name: /Practice Lab/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink.textContent).not.toMatch(/AI/);
  });
});
