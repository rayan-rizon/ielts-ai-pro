import { describe, expect, it } from 'vitest';
import { reportErrorView } from '@/features/testing/writing/report/components/reportErrorView';

describe('why a writing review has not arrived', () => {
  it('treats a repeat request as a review to check, not a failure', () => {
    expect(reportErrorView('duplicate_request')).toMatchObject({
      pill: 'Review already requested',
      title: 'Check your saved review',
      icon: 'refresh',
      tone: 'accent',
      action: 'Check for saved review',
      quota: false,
    });
  });

  it('says a pending review is being prepared', () => {
    expect(reportErrorView('Your feedback is still being prepared. Check again.')).toMatchObject({
      pill: 'Review in progress',
      title: 'Your review is being prepared',
      explanation: 'Check again shortly to see your review here.',
    });
  });

  it('offers an upgrade when the allowance is used up, keeping the server’s words', () => {
    const message = 'You have used your task review allowance.';
    expect(reportErrorView(message)).toMatchObject({
      pill: 'Allowance limit',
      title: 'The review did not finish',
      explanation: message,
      icon: 'lock',
      tone: 'warn',
      quota: true,
      action: 'Try again',
    });
  });

  it('shows any other failure as a fault, with a default explanation', () => {
    expect(reportErrorView('Network down')).toMatchObject({
      pill: 'Review interrupted',
      explanation: 'Network down',
      icon: 'alert',
      tone: 'fault',
    });
    expect(reportErrorView(true).explanation).toBe(true);
    expect(reportErrorView('').explanation).toBe('The marking service is temporarily unavailable.');
  });
});
