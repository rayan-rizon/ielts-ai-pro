// Pricing interest is an observation, never a purchase or permission to send.
export function pricingIntentCandidate(user: any, events: any[], checkout: any, now = Date.now()) {
  if (user.subscription_tier !== 'free' || checkout) return null;
  const recent = events.filter((event) => {
    const age = now - new Date(event.occurred_at).getTime();
    return age >= 30 * 60000 && age <= 48 * 3600000;
  });
  const selected = recent.find(
    (event) => event.event_type === 'plan_selected' && ['pro', 'premium'].includes(event.plan_tier)
  );
  const views = recent.filter((event) => event.event_type === 'pricing_viewed');
  if (!selected && views.length < 2) return null;
  const evidence = selected || views[0];
  return {
    content: {
      title: '20% off — your 48-hour offer is live',
      message:
        'Choose the plan that fits your practice in the next 48 hours to save 20% on your first subscription payment.',
      context_label: selected
        ? 'Based on the plan you selected'
        : 'Based on your recent plan comparison',
      cta_label: 'Claim 20% before it ends',
      cta_url: '/pricing',
    },
    evidence: [
      {
        metric: selected ? 'plan_selected' : 'pricing_visits',
        value: selected ? selected.plan_tier : views.length,
      },
      { metric: 'pricing_intent_at', value: evidence.occurred_at },
      { metric: 'offer_discount_percent', value: 20 },
      { metric: 'offer_duration_hours', value: 48 },
    ],
    rationale: selected
      ? 'Selected a paid plan; no checkout is recorded in the current window.'
      : 'Returned to pricing; no checkout is recorded in the current window.',
    destination: '/pricing',
    dedupeKey: `pricing-help:${user.id}:${new Date(evidence.occurred_at).toISOString().slice(0, 10)}`,
  };
}
