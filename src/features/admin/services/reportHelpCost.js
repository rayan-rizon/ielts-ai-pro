import { supabase } from '@/lib/supabase';
import { readAdminRpc } from './adminReadRpc';

const readReportHelpCost = async (days) => {
  try {
    return await readAdminRpc(supabase, 'get_report_assist_cost', { p_days: days });
  } catch (error) {
    // An extra line on one tile: it must never stop the overview loading.
    console.warn('Report help cost is unavailable:', error?.message);
    return null;
  }
};

const sum = (a, b) => Number((Number(a || 0) + Number(b || 0)).toFixed(6));

// Writing report translations and Band 7/8 versions are priced in their own
// cache, not in ai_api_usage, because rows there count against learner quotas.
export const withReportHelpCost = async (kpis, days) => {
  if (!kpis?.aiCost) return kpis;
  const help = await readReportHelpCost(days);
  if (!help) return kpis;
  return {
    ...kpis,
    aiCost: {
      ...kpis.aiCost,
      usd: sum(kpis.aiCost.usd, help.usd),
      prevUsd: sum(kpis.aiCost.prevUsd, help.prevUsd),
      reportHelpUsd: Number(help.usd || 0),
      reportHelpCalls: Number(help.calls || 0),
    },
  };
};
