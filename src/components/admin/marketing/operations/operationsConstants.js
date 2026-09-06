import MarketingService from '@/features/admin/services/MarketingService';

export const inputClass =
  'h-8 min-w-0 rounded-lg border border-stone-200/90 bg-white/70 px-3 text-xs font-medium text-stone-900 placeholder:text-stone-400 transition-colors focus:border-[#5a63df] focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#5a63df] dark:border-white/10 dark:bg-[#100f15] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#5a63df] dark:focus:bg-[#131315]';

export const pretty = (value) => String(value || 'Unknown').replaceAll('_', ' ');

export const date = (value) => (value ? new Date(value).toLocaleString() : 'Not recorded');

export const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

export const shortDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

export const modelName = (value) => {
  if (!value) return 'Not recorded';
  const lastSegment = value.split('/').at(-1);
  if (!lastSegment) return value;
  return lastSegment
    .replace('deepseek-v4-flash-0731', 'DeepSeek V4 Flash')
    .replace('glm-5.3-flash', 'GLM 5.3 Flash');
};

export const examples = [
  'How are messages performing by channel?',
  'How many messages were dismissed or snoozed?',
  'What is the status of checkout attempts?',
];

export const report = (action, parameters) => MarketingService.adminReport(action, parameters);
