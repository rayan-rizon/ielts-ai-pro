import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom';
import GlobalRefundPolicy from '@/features/core/pages/GlobalRefundPolicy';
import GlobalLegalRoute from '@/features/core/components/legal/GlobalLegalRoute';
import Footer from '@/features/core/components/landing/Footer';

vi.mock('@/lib/pricingUtils', () => ({ detectLocation: vi.fn() }));
import { detectLocation } from '@/lib/pricingUtils';

vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/features/core/components/landing/Navbar', () => ({ default: () => null }));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('@/components/shared/Logo', () => ({ Logo: () => <span>IELTS Ai Pro</span> }));

describe('global refund policy and regional footer boundaries', () => {
  beforeEach(() => {
    vi.mocked(detectLocation).mockResolvedValue('US');
  });

  it('clearly makes paid SaaS and AI-credit usage non-refundable under its voluntary offer', async () => {
    const { container } = render(
      <MemoryRouter>
        <GlobalRefundPolicy />
      </MemoryRouter>
    );

    await waitFor(() => expect(container.querySelector('a[href="/refund"]')).toBeTruthy());
    expect(
      screen.getByRole('heading', { name: 'Refund & Cancellation Policy' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Seven days is a request window, not a free trial/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Using all included AI credits within that period does not qualify/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/non-waivable legal right/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/bKash|Nagad|বাংলাদেশ|BDT|manual payment/i);
    expect(container.textContent).not.toContain('01776662444');
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();

    const warning = screen
      .getAllByRole('complementary')
      .find((note) => note.textContent.includes('Seven days is a request window'));
    expect(warning).toHaveClass('bg-rose-50');
  });

  it.each([
    ['/privacy', 'privacy', '/bd/privacy'],
    ['/terms', 'terms', '/bd/terms'],
    ['/refund', 'refund', '/bd/refund-cancellation'],
  ])(
    'redirects the global %s route to its Bangladesh counterpart in BD',
    async (path, type, target) => {
      vi.mocked(detectLocation).mockResolvedValue('BD');
      render(
        <MemoryRouter initialEntries={[`${path}?country=BD`]}>
          <Routes>
            <Route
              path={path}
              element={
                <GlobalLegalRoute documentType={type}>
                  <p>Global {type} page</p>
                </GlobalLegalRoute>
              }
            />
            <Route path={target} element={<p>Bangladesh {type} page</p>} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(`Bangladesh ${type} page`)).toBeInTheDocument();
      expect(screen.queryByText(`Global ${type} page`)).not.toBeInTheDocument();
    }
  );

  it('keeps global footer links on global policy routes', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/?country=US']}>
        <Footer />
      </MemoryRouter>
    );

    await waitFor(() => expect(container.querySelector('a[href="/refund"]')).toBeTruthy());
    expect(container.querySelector('a[href="/privacy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/terms"]')).toBeTruthy();
    expect(container.querySelector('a[href^="/bd/"]')).toBeNull();
    expect(container.querySelector('a[href^="/bn/"]')).toBeNull();
  });

  it('keeps Bangladesh footer links on Bangladesh-only routes', async () => {
    vi.mocked(detectLocation).mockResolvedValue('BD');
    const { container } = render(
      <MemoryRouter initialEntries={['/bd/terms?country=BD']}>
        <Footer />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(container.querySelector('a[href="/bd/refund-cancellation"]')).toBeTruthy()
    );
    expect(container.querySelector('a[href="/bd/privacy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/bd/terms"]')).toBeTruthy();
    expect(container.querySelector('a[href="/refund"]')).toBeNull();
    expect(container.querySelector('a[href="/privacy"]')).toBeNull();
    expect(container.querySelector('a[href="/terms"]')).toBeNull();
  });
});
