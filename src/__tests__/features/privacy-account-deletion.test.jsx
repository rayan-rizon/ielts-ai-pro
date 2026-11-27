import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import PrivacyPolicy from '@/features/core/pages/PrivacyPolicy';

vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/features/core/components/legal/LegalPageLayout', async (importOriginal) => ({
  ...(await importOriginal()),
  LegalPageLayout: ({ children }) => children,
}));

it('offers an account deletion request directly from the public privacy section', () => {
  const { container } = render(<PrivacyPolicy />);
  const section = container.querySelector('#account-deletion');
  expect(section).not.toBeNull();
  const link = within(section).getByRole('link', { name: /request account deletion/i });
  expect(link.getAttribute('href')).toMatch(/^mailto:mail@ieltsai\.pro\?subject=/);
  expect(screen.getByText(/email address associated with your IELTS Ai Pro account/i)).toBeTruthy();
});
