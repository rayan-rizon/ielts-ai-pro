import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import { Badge } from '@/components/ui/badge';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const ModuleCards = React.memo(({ moduleCards, stats, quickLaunchRef, onboardingHighlight }) => {
  return (
    <m.section
      ref={quickLaunchRef}
      className={cn(
        'relative h-full flex flex-col rounded-2xl transition-all duration-300 overflow-hidden group/section',
        'bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl',
        'border border-white/60 dark:border-white/[0.12]',
        'shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40',
        onboardingHighlight === 'quick' && 'ring-2 ring-primary ring-offset-4'
      )}
      data-oid="vfovvt7"
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 flex-1 p-4 md:p-5"
        data-oid="n:jhwb:"
      >
        {moduleCards.map((module) => (
          <m.div
            key={module.key}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative"
            data-oid="myn3:.:"
          >
            <Link
              to={module.href}
              className={cn(
                'block h-full relative rounded-xl border border-slate-200/50 dark:border-white/5 transition-all duration-500 overflow-hidden',
                'bg-white/80 dark:bg-slate-900/40 shadow-sm hover:shadow-md',
                'hover:ring-2 hover:ring-indigo-500/20 dark:hover:ring-indigo-500/30'
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

              <div className="p-4 space-y-3" data-oid="a-7f10.">
                <div className="flex items-start justify-between" data-oid="gthcx_-">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 group-hover:scale-110 shadow-sm',
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
                    className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300"
                    data-oid="iglb-hb"
                  />
                </div>

                <div className="space-y-1" data-oid="9a3hcaa">
                  <h3
                    className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                    data-oid="lr_qspz"
                  >
                    {module.title}
                  </h3>
                  <p
                    className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2"
                    data-oid="8hbv7.o"
                  >
                    {module.description}
                  </p>
                </div>

                <div
                  className="pt-3 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5"
                  data-oid="vz388j:"
                >
                  <div className="flex flex-col" data-oid="i2w8bvv">
                    <span
                      className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1"
                      data-oid=":82nmfj"
                    >
                      Success Rate
                    </span>
                    <div className="flex items-center gap-2" data-oid="ft9qb7:">
                      <div
                        className="text-xl font-black text-slate-900 dark:text-white tabular-nums"
                        data-oid="o_eted9"
                      >
                        {formatBand(stats.moduleAverages[module.key] || 0)}
                      </div>
                      <div
                        className="h-2 w-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                        data-oid="eu_8afk"
                      >
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.moduleAverages[module.key] || 0) * 10}%` }}
                          className="h-full rounded-full bg-indigo-500/60"
                          data-oid="wj2ilpk"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </m.div>
        ))}
      </div>
    </m.section>
  );
});

ModuleCards.displayName = 'ModuleCards';

export default ModuleCards;
