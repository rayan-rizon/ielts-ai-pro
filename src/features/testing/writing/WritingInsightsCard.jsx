import React from 'react';
import { motion } from 'framer-motion';
import { Target, PenTool, Users } from 'lucide-react';

function InsightsStatCell({ icon: Icon, iconColor, value, label }) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2 border border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-base font-black text-slate-900 dark:text-white leading-none">
          {value}
        </span>
      </div>
      <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function WritingInsightsCard({ totalPassages }) {
  return (
    <div className="lg:block hidden" data-oid="g0vddyu">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative p-0.5"
        data-oid="hhbcfg4"
      >
        <div
          className="absolute -inset-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"
          data-oid="o9pvfq6"
        />
        <div
          className="relative w-64 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-2xl p-3 shadow-xl overflow-hidden space-y-2"
          data-oid="z814.-x"
        >
          <div className="absolute top-0 right-0 p-3">
            <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Target className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="space-y-2" data-oid="pci6i0b">
            <div className="flex flex-col" data-oid="qnh0te3">
              <span
                className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-0.5"
                data-oid="5bhcwh4"
              >
                Weekly Target
              </span>
              <h4
                className="text-base font-black text-slate-900 dark:text-white"
                data-oid="1gevuh8"
              >
                Writing Mastery
              </h4>
            </div>
            <div className="space-y-1.5" data-oid="jx_vzhm">
              <div className="flex justify-between items-end" data-oid="mchgupj">
                <span className="text-[11px] font-bold text-slate-500" data-oid="z0zrf-k">
                  5 of 8 Tasks Completed
                </span>
                <span className="text-xs font-black text-orange-600" data-oid="gp-fug5">
                  62%
                </span>
              </div>
              <div
                className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                data-oid="3uf--9:"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '62%' }}
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.4)]"
                  data-oid="ki_x.p2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5" data-oid="daej..l">
              <InsightsStatCell
                icon={PenTool}
                iconColor="text-orange-500"
                value={totalPassages || 0}
                label="Total Tasks"
              />
              <InsightsStatCell
                icon={Users}
                iconColor="text-emerald-500"
                value="1.8k"
                label="Active Users"
              />
            </div>
          </div>
          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"
            data-oid="cvc4tb6"
          />
        </div>
      </motion.div>
    </div>
  );
}
