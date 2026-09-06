import { describe, expect, it } from 'vitest';
import {
  deliveryPathLabel,
  deliveryStrategyFor,
} from '@/components/admin/marketing/autopilotDeliveryStrategy';

describe('Autopilot delivery strategy', () => {
  it('uses a bottom-right suggestion for active learners and email when they are away', () => {
    const strategy = deliveryStrategyFor({
      playbook_key: 'score_plateau',
      allowed_channels: ['in_app', 'email'],
    });

    expect(strategy).toEqual({ active: ['in_app'], away: ['email'], remaining: [] });
    expect(
      deliveryPathLabel({ playbook_key: 'score_plateau', allowed_channels: ['in_app', 'email'] })
    ).toEqual({ active: 'Bottom-right suggestion', away: 'Email' });
  });

  it('reserves dashboard banners for deadline and account notices', () => {
    const strategy = deliveryStrategyFor({
      playbook_key: 'exam_countdown',
      allowed_channels: ['banner', 'email'],
    });

    expect(strategy.active).toEqual(['banner']);
    expect(strategy.away).toEqual(['email']);
  });

  it('keeps opt-in push behind email for learners away from the app', () => {
    const strategy = deliveryStrategyFor({
      playbook_key: 're_engagement',
      allowed_channels: ['in_app', 'email', 'push'],
    });

    expect(strategy.away).toEqual(['email', 'push']);
  });
});
