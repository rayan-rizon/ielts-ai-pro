import { describe, expect, it } from 'vitest';
import {
  familiarRecommendationText,
  familiarRecommendationTitle,
} from '@/components/admin/marketing/recommendationLanguage';

describe('recommendation language', () => {
  it('makes stored technical findings easier for admins to scan', () => {
    expect(
      familiarRecommendationText(
        'Autopilot interventions lack outcome measurement and exposure evidence'
      )
    ).toBe('Autopilot messages lack result tracking and proof it was seen');
    expect(
      familiarRecommendationText(
        'Run a controlled A/B test across equal segments before shifting volume'
      )
    ).toBe('Run a small A/B test with equal groups before sending more messages');
  });

  it('turns stored analyst-style titles into short issue names', () => {
    expect(
      familiarRecommendationTitle('In-app click rate is higher than email but exposure tiny')
    ).toBe('Not enough data to compare channels');
    expect(familiarRecommendationTitle('AI Autopilot interventions lack outcome measurement')).toBe(
      'Track Autopilot results'
    );
  });
});
