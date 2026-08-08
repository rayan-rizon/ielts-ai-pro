import { beforeEach, describe, expect, it } from 'vitest';
import {
  captureMarketingAttribution,
  clearMarketingAttribution,
  getMarketingAttribution,
} from '@/lib/marketingAttribution';

const campaignId = '9edcb6f4-6c21-4e56-9ca8-b437ef8c284e';
const deliveryId = '0caa2150-e777-47ec-b846-71f1cd447353';

describe('marketing attribution', () => {
  beforeEach(() => {
    clearMarketingAttribution();
    window.history.replaceState({}, '', '/');
  });

  it('captures valid campaign and delivery identifiers', () => {
    window.history.replaceState({}, '', `/?campaign_id=${campaignId}&delivery_id=${deliveryId}`);
    expect(captureMarketingAttribution()).toMatchObject({
      campaign_id: campaignId,
      delivery_id: deliveryId,
    });
    expect(getMarketingAttribution()).toMatchObject({
      campaign_id: campaignId,
      delivery_id: deliveryId,
    });
  });

  it('rejects incomplete or malformed attribution', () => {
    window.history.replaceState({}, '', '/?campaign_id=not-a-uuid');
    expect(captureMarketingAttribution()).toBeNull();
    expect(getMarketingAttribution()).toBeNull();
  });

  it('clears attribution after a confirmed purchase', () => {
    window.history.replaceState({}, '', `/?campaign_id=${campaignId}&delivery_id=${deliveryId}`);
    captureMarketingAttribution();
    window.history.replaceState({}, '', '/');
    clearMarketingAttribution();
    expect(getMarketingAttribution()).toBeNull();
  });
});
