import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { User } from '@/entities';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { countryCurrencyMap, detectLocation, getPriceData } from '@/lib/pricingUtils';
import { fetchAllTierLimits, generateFeatureStrings } from '@/lib/tierLimitsUtils';

export async function loadPricingConfiguration(options = {}) {
  const { disableBangladeshLocalization = false } = options;
  const [settings, userCountry] = await Promise.all([SystemSetting.getAll(), detectLocation()]);

  const normalizedCountry = (userCountry || '').trim().toUpperCase();
  const shouldBypassBdLocalization =
    disableBangladeshLocalization &&
    (normalizedCountry === 'BD' || normalizedCountry === 'BANGLADESH');
  const pricingCountry = shouldBypassBdLocalization ? 'US' : userCountry;

  const currency = countryCurrencyMap[pricingCountry]?.currency || 'USD';
  const tierLimits = await fetchAllTierLimits(currency);

  return { settings, userCountry, pricingCountry, tierLimits };
}

export function configurePricingPlans(defaultPlans, pricingConfig) {
  if (!pricingConfig?.settings?.pricing_tiers) {
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

    const limits = tierLimits[plan.tier];
    const featureStrings = generateFeatureStrings(plan.tier, limits);
    const updatedFeatures = plan.features
      .map((feature) => {
        if (feature.includes('AI Writing Evaluation')) {
          return featureStrings.writingFeature;
        }
        if (feature.includes('AI Speaking Session')) {
          return featureStrings.speakingFeature;
        }
        if (feature === 'Reading & Listening practice tests') {
          return [featureStrings.readingFeature, featureStrings.listeningFeature];
        }
        return feature;
      })
      .flat()
      .filter(Boolean);

    return {
      ...plan,
      basePrice: price,
      currencySymbol: symbol,
      oldPrice,
      currency,
      features: updatedFeatures,
    };
  });
}

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
    queryFn: () => loadPricingConfiguration({ disableBangladeshLocalization }),
    staleTime: 30 * 60 * 1000, // Pricing doesn't change often
  });

  // Transform plans based on fetched data
  const plans = useMemo(() => {
    return configurePricingPlans(defaultPlans, pricingConfig);
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
