import React from 'react';
import { Sparkles, TrendingUp, Crown, Zap } from 'lucide-react';
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
  isPremium,
  tier,
  selectedTimeframe,
  setSelectedTimeframe,
}) {
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
              className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2"
              data-oid="biobx9:"
            >
              Analytics Dashboard
              <Sparkles
                className="w-5 h-5 text-primary animate-pulse hidden md:block"
                data-oid="7wu6wi1"
              />
            </h1>
            <div
              className="text-muted-foreground font-semibold flex items-center gap-2"
              data-oid=".f902yv"
            >
              Real-time metrics for your IELTS success journey.
              {tier === 'premium' ? (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                  data-oid="vq-_94z"
                >
                  <Crown className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20" />
                  Premium
                </Badge>
              ) : tier === 'pro' || isPremium ? (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
                  data-oid="vq-_94z"
                >
                  <Zap className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20" />
                  Pro
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 p-1.5 bg-card/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm"
        data-oid="q-mczo."
      >
        {['7d', '30d', '90d', 'all'].map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={cn(
              'px-4 py-2 rounded-xl text-[10px] font-bold transition-all tracking-wider',
              selectedTimeframe === tf
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                : 'text-muted-foreground hover:bg-card/80'
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
