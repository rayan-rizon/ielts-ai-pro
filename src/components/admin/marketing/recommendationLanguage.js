const REPLACEMENTS = [
  [/\boutcome measurement\b/gi, 'result tracking'],
  [/\boutcome data\b/gi, 'result data'],
  [/\blearning outcome\b/gi, 'learning result'],
  [/\boutcomes\b/gi, 'results'],
  [/\binterventions\b/gi, 'messages'],
  [/\btransactional\b/gi, 'service'],
  [/\bJourneys\b/g, 'Automations'],
  [/\bJourney\b/g, 'Automation'],
  [/\bjourneys\b/g, 'automations'],
  [/\bjourney\b/g, 'automation'],
  [/\bexposure is low\b/gi, 'few messages were confirmed as seen'],
  [/\bexposure tiny\b/gi, 'very few views'],
  [/\bclick on exposure\b/gi, 'click rate from views'],
  [/\bexposure evidence\b/gi, 'proof it was seen'],
  [/\bconfirmed exposure\b/gi, 'confirmed views'],
  [/\bexposures\b/gi, 'views'],
  [/\bexposure\b/gi, 'views'],
  [/\baccepted sends\b/gi, 'accepted emails'],
  [/\baggregated channels\b/gi, 'channel totals'],
  [/\bcontact pressure\b/gi, 'too many messages'],
  [/\binfer superiority\b/gi, 'say one works better'],
  [/\bshifting volume\b/gi, 'sending more messages'],
  [/\bshift volume\b/gi, 'send more messages'],
  [/\bcontrolled A\/B test across equal segments\b/gi, 'small A/B test with equal groups'],
  [/\bdefined success criteria\b/gi, 'a clear success measure'],
  [/\bdomain reputation\b/gi, 'sender reputation'],
  [/\bobservable events\b/gi, 'current tracking'],
  [/\bcurrent sends\b/gi, 'current messages'],
  [/\bchannel mix\b/gi, 'channel choice'],
];

export function familiarRecommendationText(value) {
  return REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || '')
  );
}

const TITLE_REPLACEMENTS = [
  [/^Payment recovery .*\boff\b.*$/i, 'Review payment recovery'],
  [/^In-app click rate .*$/i, 'Not enough data to compare channels'],
  [/^Saved test reminder .*$/i, 'Track saved-test reminders'],
  [/^AI Autopilot .*result tracking.*$/i, 'Track Autopilot results'],
  [/^Email .*accepted emails.*$/i, 'Check whether emails are being seen'],
];

export function familiarRecommendationTitle(value) {
  const title = familiarRecommendationText(value);
  const replacement = TITLE_REPLACEMENTS.find(([pattern]) => pattern.test(title));
  return replacement ? replacement[1] : title;
}
