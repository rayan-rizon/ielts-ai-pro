import React from 'react';
import { motion } from 'framer-motion';
import { Target, Mic, Users } from 'lucide-react';

function InsightsStatCell({ icon: Icon, iconColor, value, label }) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
          {value}
        </span>
      </div>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="space-y-3" data-oid=".t-00iz">
      <div className="flex justify-between items-end" data-oid="2z8z4xc">
        <span className="text-xs font-bold text-slate-500" data-oid="fte5wt8">
          4 of 6 Tests Completed
        </span>
        <span className="text-sm font-black text-rose-600" data-oid="2:jvn-y">
          66%
        </span>
      </div>
      <div
        className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
        data-oid="6umq2zj"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '66%' }}
          className="h-full bg-gradient-to-r from-rose-600 to-orange-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.4)]"
          data-oid="ctk33p4"
        />
      </div>
    </div>
  );
}

export function SpeakingInsightsCard({ totalPassages }) {
  return (
    <div className="lg:block hidden" data-oid="joksnyb">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative p-1"
        data-oid="0obb40s"
      >
        <div
          className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
          data-oid="l76twcx"
        />
        <div
          className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
          data-oid="-msck35"
        >
          <div className="absolute top-0 right-0 p-4" data-oid="gh9xdh:">
            <div
              className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20"
              data-oid="y_2cziw"
            >
              <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" data-oid="o5:7l0f" />
            </div>
          </div>

          <div className="space-y-3" data-oid="jsqm04q">
            <div className="flex flex-col" data-oid="w9c4j3-">
              <span
                className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1"
                data-oid="x--cuk7"
              >
                Weekly Target
              </span>
              <h4 className="text-xl font-black text-slate-900 dark:text-white" data-oid="zpulp5_">
                Speaking Fluency
              </h4>
            </div>

            <ProgressBar />

            <div className="grid grid-cols-2 gap-3 pt-2" data-oid="zh_6xw5">
              <InsightsStatCell
                icon={Mic}
                iconColor="text-rose-500"
                value={totalPassages || 0}
                label="Total Tests"
              />
              <InsightsStatCell
                icon={Users}
                iconColor="text-emerald-500"
                value="0.8k"
                label="Active Users"
              />
            </div>
          </div>

          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"
            data-oid="m5l.oro"
          />
        </div>
      </motion.div>
    </div>
  );
}
