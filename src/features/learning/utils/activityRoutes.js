const ACTIVITY_ROUTES = {
  reading: '/reading',
  writing: '/writing',
  listening: '/listening',
  speaking: '/speaking',
  grammar: '/grammar',
  vocabulary: '/vocabulary',
};

export function buildActivityUrl(activity = {}) {
  const routeKey = String(activity?.routing?.route || activity?.module || '').toLowerCase();
  const base = ACTIVITY_ROUTES[routeKey] || '/dashboard';

  const params = new URLSearchParams();
  const mode = ['grammar', 'vocabulary'].includes(routeKey)
    ? activity?.routing?.mode || activity?.requested_mode
    : activity?.requested_mode || activity?.routing?.mode;
  const skill = activity?.skill_targets?.[0] || activity?.routing?.skill;
  const activityId = activity?.id || activity?.activity_id;
  const transferTarget = activity?.routing?.transferTarget;
  if (mode) params.set('mode', mode);
  if (routeKey === 'grammar' && skill) params.set('skill', skill);
  if (activityId) params.set('activityId', activityId);
  if (routeKey === 'grammar' && transferTarget) params.set('transfer', transferTarget);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
