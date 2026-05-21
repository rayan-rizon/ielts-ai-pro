import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { ITEM_VARIANTS, MODULE_META } from '../constants';
import { formatBand } from '../utils';
import EmptyAnalyticsState from './EmptyAnalyticsState';
import { Target, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DiagnosticCard = React.memo(function DiagnosticCard({
  module,
  idx,
  isWeakest,
  compact = false,
}) {
  const Icon = module.icon;
  const progressPercent = Math.round((module.avg / 9) * 100);
  const status = module.avg >= 7 ? 'Advanced' : module.avg >= 5 ? 'Intermediate' : 'Learning';
  const statusColor =
    module.avg >= 7 ? 'text-emerald-500' : module.avg >= 5 ? 'text-amber-500' : 'text-blue-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.08, duration: 0.35 }}
      className="group relative h-full"
      data-oid="sty95db"
    >
      <div
        className={cn(
          'absolute inset-0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br',
          module.gradient
        )}
        data-oid="oq2fwwn"
      />

      <Card
        className={cn(
          'rounded-2xl border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-2xl transition-all duration-300 relative z-10 overflow-hidden border-opacity-30 hover:-translate-y-1 group h-full',
          isWeakest && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
        )}
        data-oid="5j61czn"
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br',
            module.gradient
          )}
          data-oid="x7dr79r"
        />

        <CardContent
          className={cn('flex flex-col h-full', compact ? 'p-4' : 'p-6')}
          data-oid="3zltt4c"
        >
          {/* Header - Module icon + title + status */}
          <div className="flex items-center gap-3 mb-4" data-oid="kf_81i4">
            <div
              className={cn(
                'rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br',
                module.gradient,
                compact ? 'p-2.5' : 'p-3'
              )}
              data-oid="-2-9s0k"
            >
              <Icon className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} data-oid="2kjjvrr" />
            </div>
            <div className="flex-1 min-w-0" data-oid="x7jofx0">
              <h4
                className={cn(
                  'font-black text-foreground tracking-tight',
                  compact ? 'text-base' : 'text-lg'
                )}
                data-oid="ek4c97x"
              >
                {module.title}
              </h4>
              <div className="flex items-center gap-2" data-oid="7objp:r">
                <span
                  className={cn('text-[10px] font-black tracking-wider', statusColor)}
                  data-oid="hmd.t95"
                >
                  {status}
                </span>
                {isWeakest && (
                  <Badge
                    className="bg-primary text-white border-0 font-black text-[8px] tracking-widest px-1.5 py-0 animate-pulse"
                    data-oid="jc39o1l"
                  >
                    Focus
                  </Badge>
                )}
              </div>
            </div>
            {/* Show score only in non-compact mode */}
            {!compact && (
              <div className="text-right shrink-0" data-oid="9_ju:f:">
                <p
                  className="text-[9px] font-black tracking-widest text-muted-foreground/60"
                  data-oid="2cs47k1"
                >
                  Score
                </p>
                <h3
                  className="text-2xl font-black text-foreground tracking-tight"
                  data-oid="vb3g69q"
                >
                  {formatBand(module.avg)}
                </h3>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 flex-1" data-oid="yjizldo">
            <div
              className="flex justify-between text-[10px] font-black tracking-widest text-muted-foreground/80"
              data-oid="p16t7u4"
            >
              <span data-oid="0diwxsw">Progress</span>
              <span className="text-primary" data-oid="z-4qb8g">
                {progressPercent}%
              </span>
            </div>
            <div
              className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20"
              data-oid="-2-6feb"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={cn('h-full rounded-full bg-gradient-to-r', module.gradient)}
                data-oid="8wwnx_d"
              />
            </div>

            {/* Stats row - compact shows inline, regular shows grid */}
            <div
              className={cn('pt-2', compact ? 'flex items-center gap-4' : 'grid grid-cols-2 gap-3')}
              data-oid="n_xiz1t"
            >
              <div
                className={cn(
                  compact ? '' : 'bg-muted/30 rounded-xl p-2.5 border border-border/20 text-center'
                )}
                data-oid="vh9slxy"
              >
                <p className="text-[9px] font-black text-muted-foreground" data-oid="3wxbtlx">
                  Attempts
                </p>
                <p
                  className={cn('font-black text-foreground', compact ? 'text-sm' : 'text-base')}
                  data-oid="q3bp-ti"
                >
                  {module.tests}
                </p>
              </div>
              {!compact && (
                <div
                  className="bg-muted/30 rounded-xl p-2.5 border border-border/20 text-center"
                  data-oid="6p21i8u"
                >
                  <p className="text-[9px] font-black text-muted-foreground" data-oid="-zjl9l4">
                    Status
                  </p>
                  <p
                    className={cn('text-[10px] font-black tracking-wider', statusColor)}
                    data-oid="b68kp9s"
                  >
                    {status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div
            className={cn('pt-3 border-t border-border/40', compact ? 'mt-3' : 'mt-4')}
            data-oid="jaok0-4"
          >
            <Button
              asChild
              size={compact ? 'sm' : 'default'}
              className={cn(
                'w-full rounded-xl font-black transition-all duration-300 shadow-lg hover:shadow-xl group/btn',
                module.avg < 7
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-muted/80',
                compact ? 'text-xs h-8' : 'text-sm'
              )}
              data-oid="18zw5fv"
            >
              <Link to={module.href} data-oid="8jyzd._">
                <Zap className={cn('mr-1.5', compact ? 'w-3 h-3' : 'w-4 h-4')} data-oid="ok9.69y" />
                Train
                <ArrowRight
                  className="w-3 h-3 ml-auto opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all"
                  data-oid="kc3axhe"
                />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Helper for Badge since it wasn't imported properly in the original from UI
const Badge = ({ children, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      className
    )}
    data-oid="9mq7voa"
  >
    {children}
  </span>
);

export default function SkillDiagnostics({ stats, compact = false }) {
  if (!stats?.moduleStats || stats.moduleStats.length === 0) {
    return (
      <motion.section variants={ITEM_VARIANTS} className="space-y-4" data-oid="4i_li4d">
        <div className="flex items-center justify-between px-2" data-oid="3k1x2yf">
          <div className="space-y-1" data-oid="8mb13-x">
            <h2
              className={cn(
                'font-black text-foreground tracking-tight',
                compact ? 'text-xl' : 'text-2xl'
              )}
              data-oid="60h.iu6"
            >
              Your Skills
            </h2>
            <p className="text-xs text-muted-foreground font-medium" data-oid="mc2y.b-">
              See how you're performing in each IELTS section.
            </p>
          </div>
        </div>
        <Card
          className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl p-8"
          data-oid="kpsk.2_"
        >
          <EmptyAnalyticsState
            icon={Target}
            title="Skill Profile"
            description="Complete practice tests in different modules to build your performance profile and see detailed skill metrics."
            className="py-12"
            data-oid="bu6fvp-"
          />
        </Card>
      </motion.section>
    );
  }

  const moduleList = MODULE_META.map((meta) => {
    const s = stats.moduleStats.find((m) => m.type === meta.key) || { avg: 0, tests: 0 };
    return { ...meta, ...s };
  });

  // Identify weakest module for "Focus Here" banner
  const weakest = [...moduleList].filter((m) => m.tests > 0).sort((a, b) => a.avg - b.avg)[0]?.key;

  return (
    <motion.section variants={ITEM_VARIANTS} className="space-y-4" data-oid="b4w7c3z">
      <div className="flex items-center justify-between px-2" data-oid="fh7oxzp">
        <div className="space-y-1" data-oid="_ouuy4v">
          <h2
            className={cn(
              'font-black text-foreground tracking-tight',
              compact ? 'text-xl' : 'text-2xl'
            )}
            data-oid="9ycy-yh"
          >
            Your Skills
          </h2>
          <p className="text-xs text-muted-foreground font-medium" data-oid="ndoz-g_">
            {compact
              ? 'Quick overview of your module performance'
              : "See how you're performing in each IELTS section."}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'grid gap-4',
          compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 gap-6'
        )}
        data-oid="sh8_-.l"
      >
        {moduleList.map((m, i) => (
          <DiagnosticCard
            key={m.key}
            module={m}
            idx={i}
            isWeakest={m.key === weakest}
            compact={compact}
            data-oid="zz91ezv"
          />
        ))}
      </div>
    </motion.section>
  );
}
