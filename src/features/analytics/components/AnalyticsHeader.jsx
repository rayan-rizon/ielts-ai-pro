import React from 'react';
import { TrendingUp, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';

const IconWrapper = React.memo(function IconWrapper({ icon: Icon, color, className }) {
  return (
    <div
      className={cn('relative flex items-center justify-center rounded-xl p-2', className)}
      data-oid="utfjg1b"
    >
      <div className={cn('absolute inset-0 opacity-15 rounded-xl', color)} data-oid="x9zwjvi" />
      <Icon
        className={cn('w-4 h-4 relative z-10', color.replace('bg-', 'text-'))}
        data-oid="uig3e3o"
      />
    </div>
  );
});

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
    <div
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1"
      data-oid="z2vs7oa"
    >
      <div className="space-y-1" data-oid="0w7p:d7">
        <div className="flex items-center gap-3" data-oid="tzkuqnv">
          <IconWrapper icon={TrendingUp} color="bg-primary" className="p-2.5" data-oid="rz.k-jx" />
          <div data-oid="k-3c2x3">
            <h1
              className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl"
              data-oid="biobx9:"
            >
              Analytics Dashboard
            </h1>
            <div
              className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400"
              data-oid=".f902yv"
            >
              {greeting}
              {firstName ? `, ${firstName}` : ''}
              {stats?.totalTests
                ? ` · ${stats.totalTests} completed session${stats.totalTests === 1 ? '' : 's'} in this period · target band ${stats.targetScore}`
                : ' · Your performance, pace, and next practice focus.'}
              {tier === 'premium' ? (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                  data-oid="vq-_94z"
                >
                  <Crown className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20" />
                  PREMIUM
                </Badge>
              ) : tier === 'pro' || isPremium ? (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
                  data-oid="vq-_94z"
                >
                  <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
                  PRO
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid w-full grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:w-auto"
        data-oid="q-mczo."
        aria-label="Analytics timeframe"
      >
        {['7d', '30d', '90d', 'all'].map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setSelectedTimeframe(tf)}
            aria-pressed={selectedTimeframe === tf}
            className={cn(
              'h-8 min-w-0 rounded-lg px-3 text-xs font-extrabold transition-all sm:px-4',
              selectedTimeframe === tf
                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            )}
            data-oid="llu3bgs"
          >
            {tf === 'all' ? 'All' : `${tf.slice(0, -1)}${tf.slice(-1).toUpperCase()}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export { IconWrapper };
