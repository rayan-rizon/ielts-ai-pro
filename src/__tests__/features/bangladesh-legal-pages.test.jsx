import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BangladeshLegalPage from '@/features/core/pages/BangladeshLegalPage';

vi.mock('@/lib/pricingUtils', () => ({ detectLocation: vi.fn() }));
import { detectLocation } from '@/lib/pricingUtils';

vi.mock('@/components/shared/DocumentHead', () => ({
  default: ({ noIndex, noFollow }) => (
    <div data-testid="document-head" data-no-index={noIndex} data-no-follow={noFollow} />
  ),
}));

vi.mock('@/features/core/components/landing/Navbar', () => ({ default: () => null }));
vi.mock('@/features/core/components/landing/Footer', () => ({ default: () => null }));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

describe('Bangladesh legal pages', () => {
  beforeEach(() => {
    vi.mocked(detectLocation).mockResolvedValue('BD');
  });

  it('limits the seven-day policy to completely unused purchases', async () => {
    const { container } = render(
      <MemoryRouter>
        <BangladeshLegalPage documentType="refund" language="en" />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Bangladesh Refund & Cancellation Policy' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Seven days is a request window, not a free trial/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/uses all included credits is not eligible/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed duplicate or incorrect charge/i)).toBeInTheDocument();
    expect(screen.getAllByText('QuantByte Tech').length).toBeGreaterThan(0);
    expect(screen.queryByText('03663')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/manual payment/i);
    expect(screen.getByTestId('document-head')).toHaveAttribute('data-no-index', 'true');
    expect(await screen.findByRole('link', { name: 'বাংলা' })).toHaveAttribute(
      'href',
      '/bn/refund-cancellation'
    );
  });

  it('provides clear Bangla SaaS refund wording and company identity', async () => {
    const { container } = render(
      <MemoryRouter>
        <BangladeshLegalPage documentType="refund" language="bn" />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'বাংলাদেশ রিফান্ড ও সাবস্ক্রিপশন বাতিল নীতি' })
    ).toBeInTheDocument();
    expect(screen.getByText(/সাত দিন আবেদন করার সময়—বিনামূল্যের ট্রায়াল নয়/)).toBeInTheDocument();
    expect(screen.getByText(/সব অন্তর্ভুক্ত ক্রেডিট ব্যবহারকারী/)).toBeInTheDocument();
    expect(screen.getByText(/IELTS Ai Pro, QuantByte Tech-এর একটি পণ্য/)).toBeInTheDocument();
    expect(screen.queryByText('03663')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/ম্যানুয়াল পেমেন্ট/);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/bd/refund-cancellation'
    );
  });

  it('redirects local Bangla and English routes to global pages outside Bangladesh', async () => {
    vi.mocked(detectLocation).mockResolvedValue('US');

    render(
      <MemoryRouter initialEntries={['/bn/refund-cancellation?country=US']}>
        <Routes>
          <Route
            path="/bn/refund-cancellation"
            element={<BangladeshLegalPage documentType="refund" language="bn" />}
          />
          <Route path="/refund" element={<p>Global Stripe refund page</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Global Stripe refund page')).toBeInTheDocument();
  });

  it('redirects the Bangladesh English route outside Bangladesh too', async () => {
    vi.mocked(detectLocation).mockResolvedValue('US');

    render(
      <MemoryRouter initialEntries={['/bd/refund-cancellation?country=US']}>
        <Routes>
          <Route
            path="/bd/refund-cancellation"
            element={<BangladeshLegalPage documentType="refund" language="en" />}
          />
          <Route path="/refund" element={<p>Global Stripe refund page</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Global Stripe refund page')).toBeInTheDocument();
  });
});
