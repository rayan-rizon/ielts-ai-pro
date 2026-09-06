const CHANNEL_LABELS = {
  in_app: 'Bottom-right suggestion',
  banner: 'Dashboard banner',
  email: 'Email',
  push: 'Push reminder',
};

const DEFAULT_STRATEGIES = {
  cancellation_support: { active: ['banner'], away: ['email'] },
  exam_countdown: { active: ['banner'], away: ['email'] },
  incomplete_test: { active: ['in_app'], away: ['email', 'push'] },
  re_engagement: { active: ['in_app'], away: ['email', 'push'] },
};

const unique = (channels) => [...new Set(channels.filter(Boolean))];
const permitted = (channels, allowed) => channels.filter((channel) => allowed.includes(channel));

/**
 * Turns the stored strategy into plain language for admin controls and previews.
 * The Edge Function remains the authority at delivery time; this mirrors its
 * active/away ordering without exposing the internal priority plumbing.
 */
export const deliveryStrategyFor = (policy = {}) => {
  const source = policy || {};
  const allowed =
    Array.isArray(source.allowed_channels) && source.allowed_channels.length
      ? source.allowed_channels
      : ['in_app'];
  const configured = source.config?.delivery_strategy || {};
  const fallback = DEFAULT_STRATEGIES[source.playbook_key] || {
    active: ['in_app'],
    away: ['email'],
  };
  const active = permitted(
    Array.isArray(configured.active_channels) ? configured.active_channels : fallback.active,
    allowed
  );
  const away = permitted(
    Array.isArray(configured.away_channels) ? configured.away_channels : fallback.away,
    allowed
  );
  const remaining = allowed.filter(
    (channel) => !active.includes(channel) && !away.includes(channel)
  );

  return {
    active: unique(active.length ? active : permitted(['in_app', 'banner'], allowed)),
    away: unique(away.length ? away : permitted(['email', 'push'], allowed)),
    remaining,
  };
};

export const channelLabel = (channel) => CHANNEL_LABELS[channel] || channel;

export const deliveryPathLabel = (policy) => {
  const strategy = deliveryStrategyFor(policy);
  const active = strategy.active.map(channelLabel).join(' + ') || 'No in-app surface';
  const away = strategy.away.map(channelLabel).join(' + ') || 'No external reminder';
  return { active, away };
};
