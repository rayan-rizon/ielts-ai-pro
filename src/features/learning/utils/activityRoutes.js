import { SKILL_LAB_ENABLED, skillLabUrl } from '@/features/skill-lab/skills';
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
  if (
    ['practice-lab', 'skill-lab'].includes(routeKey) &&
    ['writing', 'speaking'].includes(activity.module)
  ) {
    const params = new URLSearchParams();
    if (activity.id || activity.activity_id)
      params.set('activityId', activity.id || activity.activity_id);
    return `/${activity.module}${params.size ? `?${params}` : ''}`;
  }
  if (
    SKILL_LAB_ENABLED &&
    (routeKey === 'practice-lab' ||
      routeKey === 'skill-lab' ||
      (['reading', 'listening'].includes(routeKey) &&
        ['targeted_drill', 'targeted_repair', 'spaced_review'].includes(activity.activity_type)))
  ) {
    return skillLabUrl({
      module: activity.module || routeKey,
      skill: activity.skill_targets?.[0] || activity.routing?.skill,
      sourceId: activity.source_session_id,
      activityId: activity.id || activity.activity_id,
    });
  }
  const base = ACTIVITY_ROUTES[routeKey] || '/dashboard';

  const params = new URLSearchParams();
  const mode = ['grammar', 'vocabulary'].includes(routeKey)
    ? activity?.routing?.mode || activity?.requested_mode
    : activity?.requested_mode || activity?.routing?.mode;
  const skill = activity?.skill_targets?.[0] || activity?.routing?.skill;
  const activityId = activity?.id || activity?.activity_id;
  if (mode) params.set('mode', mode);
  if (routeKey === 'grammar' && skill) params.set('skill', skill);
  if (activityId) params.set('activityId', activityId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
