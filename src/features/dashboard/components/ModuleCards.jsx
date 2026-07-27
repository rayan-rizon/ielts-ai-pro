import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import { CardHeader, CardTitle } from '@/components/ui/card';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const ModuleCardItem = React.memo(({ module, stats }) => {
  return (
    <m.div
      variants={itemVariants}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative"
      data-oid="myn3:.:"
    >
      <Link
        to={module.href}
        className={cn(
          'block h-full relative rounded-xl border transition-all duration-500 overflow-hidden',
          module.key === 'reading' &&
            'bg-blue-50/30 border-blue-100/60 dark:bg-blue-950/10 dark:border-blue-900/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800',
          module.key === 'writing' &&
            'bg-orange-50/30 border-orange-100/60 dark:bg-orange-950/10 dark:border-orange-900/20 hover:bg-orange-50/60 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-800',
          module.key === 'listening' &&
            'bg-purple-50/30 border-purple-100/60 dark:bg-purple-950/10 dark:border-purple-900/20 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-800',
          module.key === 'speaking' &&
            'bg-rose-50/30 border-rose-100/60 dark:bg-rose-950/10 dark:border-rose-900/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800'
        )}
        data-oid="v_m3tdx"
      >
        {/* Accent Glow on Hover */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10',
            module.key === 'reading' && 'bg-blue-500/10',
            module.key === 'writing' && 'bg-orange-500/10',
            module.key === 'listening' && 'bg-purple-500/10',
            module.key === 'speaking' && 'bg-rose-500/10'
          )}
          data-oid="un0bptu"
        />

        <div className="p-3 space-y-2" data-oid="a-7f10.">
          <div className="flex items-start justify-between" data-oid="gthcx_-">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 group-hover:scale-110 shadow-sm',
                module.key === 'reading' &&
                  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
                module.key === 'writing' &&
                  'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white',
                module.key === 'listening' &&
                  'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
                module.key === 'speaking' &&
                  'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white'
              )}
              data-oid="i5r5j_l"
            >
              <module.icon className="w-4.5 h-4.5" data-oid="bcta24a" />
            </div>
            <ArrowRight
              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
              data-oid="iglb-hb"
            />
          </div>

          <div className="space-y-0.5" data-oid="9a3hcaa">
            <h3
              className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight"
              data-oid="lr_qspz"
            >
              {module.title}
            </h3>
            <p
              className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight line-clamp-1"
              data-oid="8hbv7.o"
            >
              {module.description}
            </p>
          </div>

          <div
            className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5"
            data-oid="vz388j:"
          >
            <div className="flex flex-col w-full" data-oid="i2w8bvv">
              <div className="flex items-center justify-between mb-1" data-oid=":82nmfj-wrapper">
                <span
                  className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest"
                  data-oid=":82nmfj"
                >
                  Avg Band
                </span>
                <span
                  className="text-xs font-black text-slate-900 dark:text-white tabular-nums leading-none"
                  data-oid="o_eted9"
                >
                  {formatBand(stats.moduleAverages?.[module.key] || 0)}{' '}
                  <span className="text-[9px] text-slate-400 font-bold">/ 9.0</span>
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                data-oid="eu_8afk"
              >
                <m.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, Math.max(0, ((stats.moduleAverages?.[module.key] || 0) / 9) * 100))}%`,
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    module.key === 'reading' &&
                      'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                    module.key === 'writing' &&
                      'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
                    module.key === 'listening' &&
                      'bg-gradient-to-r from-violet-500 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
                    module.key === 'speaking' &&
                      'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  )}
                  data-oid="wj2ilpk"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
});
ModuleCardItem.displayName = 'ModuleCardItem';

const ModuleCards = React.memo(({ moduleCards, stats, quickLaunchRef, onboardingHighlight }) => {
  return (
    <m.section
      ref={quickLaunchRef}
      className={cn(
        'relative h-full flex flex-col rounded-2xl transition-all duration-300 overflow-hidden group/section',
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
        'border border-violet-200/80 dark:border-violet-500/20',
        'shadow-[0_10px_30px_-10px_rgba(109,85,238,0.08)]',
        'hover:shadow-[0_15px_35px_-10px_rgba(109,85,238,0.14)] transition-all duration-300',
        'hover:border-violet-300 dark:hover:border-violet-400/40',
        onboardingHighlight === 'quick' && 'ring-2 ring-primary ring-offset-4'
      )}
      data-oid="vfovvt7"
    >
      <CardHeader className="p-3.5 md:p-4 pb-0" data-oid="module-cards-header">
        <CardTitle
          className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5"
          data-oid="module-cards-title"
        >
          <div
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20 transition-transform group-hover/section:rotate-12"
            data-oid="module-cards-icon-wrapper"
          >
            <Compass className="w-4 h-4 transition-transform duration-500 group-hover/section:scale-110" />
          </div>
          <div>
            <span className="tracking-tight text-sm md:text-base">Practice Modules</span>
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5">
              Select a skill to train
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-3.5 flex-1 p-3.5 md:p-4 pt-2"
        data-oid="n:jhwb:"
      >
        {moduleCards.map((module) => (
          <ModuleCardItem key={module.key} module={module} stats={stats} />
        ))}
      </div>
    </m.section>
  );
});

ModuleCards.displayName = 'ModuleCards';

export default ModuleCards;
