import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { User } from '@/entities';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { detectLocation, getPriceData } from '@/lib/pricingUtils';
import { fetchAllTierLimits, generateFeatureStrings } from '@/lib/tierLimitsUtils';

export function usePricing(defaultPlans, options = {}) {
  const { disableBangladeshLocalization = false } = options;

  // Fetch user data
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => User.me(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch pricing configuration and location
  const { data: pricingConfig, isLoading: isPricingLoading } = useQuery({
    queryKey: [
      'subscription',
      'pricingConfig',
      disableBangladeshLocalization ? 'disable-bd-localization' : 'default-localization',
    ],
    queryFn: async () => {
      const [settings, userCountry] = await Promise.all([SystemSetting.getAll(), detectLocation()]);

      const normalizedCountry = (userCountry || '').trim().toUpperCase();
      const shouldBypassBdLocalization =
        disableBangladeshLocalization &&
        (normalizedCountry === 'BD' || normalizedCountry === 'BANGLADESH');
      const pricingCountry = shouldBypassBdLocalization ? 'US' : userCountry;

      const { countryCurrencyMap } = await import('@/lib/pricingUtils');
      const currency = countryCurrencyMap[pricingCountry]?.currency || 'USD';
      const tierLimits = await fetchAllTierLimits(currency);

      return { settings, userCountry, pricingCountry, tierLimits };
    },
    staleTime: 30 * 60 * 1000, // Pricing doesn't change often
  });

  // Transform plans based on fetched data
  const plans = useMemo(() => {
    if (!pricingConfig || !pricingConfig.settings.pricing_tiers) {
      return defaultPlans;
    }

    const { settings, pricingCountry, tierLimits } = pricingConfig;

    return defaultPlans.map((plan) => {
      const { price, symbol, oldPrice, currency } = getPriceData(
        plan.tier,
        plan.basePrice,
        plan.oldPrice,
        settings,
        pricingCountry
      );

      // Get dynamic feature strings from tier limits
      const limits = tierLimits[plan.tier];
      const featureStrings = generateFeatureStrings(plan.tier, limits);

      // Update features with dynamic limits
      const updatedFeatures = plan.features
        .map((feature) => {
          if (feature.includes('AI Writing Evaluations')) {
            return featureStrings.writingFeature;
          }
          if (feature.includes('AI Speaking Sessions')) {
            return featureStrings.speakingFeature; // Returns null if 0, omitted by filter(Boolean)
          }
          return feature;
        })
        .filter(Boolean);

      return {
        ...plan,
        basePrice: price,
        currencySymbol: symbol,
        oldPrice: oldPrice,
        currency: currency,
        features: updatedFeatures,
      };
    });
  }, [pricingConfig, defaultPlans]);

  return {
    user,
    refetchUser,
    plans,
    detectedCountry: pricingConfig?.userCountry,
    pricingCountry: pricingConfig?.pricingCountry,
    isLoading: isPricingLoading,
    pricingConfig,
  };
}
