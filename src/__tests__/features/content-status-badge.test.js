import { describe, expect, it } from 'vitest';
import { getContentStatus } from '@/features/subscription/config/contentAccess';

describe('content status badges', () => {
  it('keeps accessible paid content free of an unnecessary plan badge', () => {
    expect(
      getContentStatus({ user: { subscription_tier: 'premium' }, requiredTier: 'pro' })
    ).toMatchObject({ label: 'Available', tone: 'included', visible: false });
  });

  it('keeps inaccessible content accurately locked and finished accessible content completed', () => {
    expect(
      getContentStatus({ user: { subscription_tier: 'free' }, requiredTier: 'premium' })
    ).toMatchObject({ label: 'Premium', tone: 'locked' });
    expect(
      getContentStatus({
        user: { subscription_tier: 'free', role: 'admin' },
        requiredTier: 'pro',
      })
    ).toMatchObject({ label: 'Pro', tone: 'locked' });
    expect(
      getContentStatus({
        user: { subscription_tier: 'premium' },
        requiredTier: 'premium',
        completed: true,
      })
    ).toMatchObject({ label: 'Completed', tone: 'completed' });
  });
});
