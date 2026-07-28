import React from 'react';
import { BarChart2, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';

const IconWrapper = React.memo(function IconWrapper({ icon: Icon, color, className }) {
  return (
    <div className={cn('relative flex items-center justify-center rounded-xl p-2', className)}>
      <div className={cn('absolute inset-0 opacity-15 rounded-xl', color)} />
      <Icon className={cn('w-4 h-4 relative z-10', color.replace('bg-', 'text-'))} />
    </div>
  );
});

const AnalyticsEmblemSVG = () => (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#efedff] text-[#5661e9] ring-1 ring-[#5661e9]/20 shadow-xs dark:bg-indigo-500/20 dark:text-indigo-300">
    <BarChart2 className="h-5 w-5 text-[#5661e9] dark:text-indigo-300" strokeWidth={2.4} />
  </div>
);

export default function AnalyticsHeader({
  user,
  stats,
  isPremium,
  tier,
  selectedTimeframe,
  setSelectedTimeframe,
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || '';
  const firstName = displayName.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <AnalyticsEmblemSVG />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight">
            Analytics Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pl-0.5 pt-0.5">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
          {stats?.totalTests
            ? ` · ${stats.totalTests} completed session${stats.totalTests === 1 ? '' : 's'} · target band ${stats.targetScore}`
            : ' · Your performance, pace, and next practice focus.'}
          {tier === 'premium' ? (
            <Badge
              variant="outline"
              className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5"
            >
              <Crown className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20" />
              PREMIUM
            </Badge>
          ) : tier === 'pro' || isPremium ? (
            <Badge
              variant="outline"
              className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
              PRO
            </Badge>
          ) : null}
        </div>
      </div>

      <div
        className="flex items-center gap-1 rounded-[16px] border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-1 shadow-xs shrink-0 self-start md:self-auto"
        aria-label="Analytics timeframe"
      >
        {['7d', '30d', '90d', 'all'].map((tf) => {
          const isActive = selectedTimeframe === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => setSelectedTimeframe(tf)}
              aria-pressed={isActive}
              className={cn(
                'h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-[#5661e9] text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
              )}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { IconWrapper };
