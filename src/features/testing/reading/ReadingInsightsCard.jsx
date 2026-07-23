import React from 'react';
import { m } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';

export function ReadingInsightsCard({ totalPassages }) {
  return (
    <div className="lg:block hidden" data-oid="16_8cht">
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative p-0.5"
        data-oid="6zifozt"
      >
        <div
          className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"
          data-oid="9y-amia"
        />
        <div
          className="relative w-64 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-2xl p-3 shadow-xl overflow-hidden"
          data-oid="6d2v9jr"
        >
          <div className="absolute top-0 right-0 p-3" data-oid="393o.gg">
            <div
              className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
              data-oid=":u.0rv2"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" data-oid="dhqluy5" />
            </div>
          </div>

          <div className="space-y-2" data-oid="72nwm1n">
            <div className="flex flex-col" data-oid="q_tpwyo">
              <span
                className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5"
                data-oid=".pg4_8y"
              >
                Weekly Target
              </span>
              <h4
                className="text-base font-black text-slate-900 dark:text-white"
                data-oid="rhi41c1"
              >
                Mastery Progress
              </h4>
            </div>

            <div className="space-y-2" data-oid="c1.n3a3">
              <div className="flex justify-between items-end" data-oid="z6zbqet">
                <span className="text-[11px] font-bold text-slate-500" data-oid="16ffq.h">
                  6 of 10 Tests Completed
                </span>
                <span className="text-xs font-black text-blue-600" data-oid="vfo1y-4">
                  60%
                </span>
              </div>
              <div
                className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                data-oid="7esgde1"
              >
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  data-oid="762zpv."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1" data-oid="w92129j">
              <div
                className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 border border-slate-100 dark:border-white/5"
                data-oid="z0k-p_y"
              >
                <div className="flex items-center gap-1.5 mb-0.5" data-oid="oy33w-d">
                  <BookOpen className="w-3 h-3 text-indigo-500" data-oid="qrk0pgc" />
                  <span
                    className="text-base font-black text-slate-900 dark:text-white leading-none"
                    data-oid="k4f:iyv"
                  >
                    {totalPassages}
                  </span>
                </div>
                <span
                  className="text-[8px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="tf3.7fb"
                >
                  Total Tests
                </span>
              </div>
              <div
                className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 border border-slate-100 dark:border-white/5"
                data-oid="fk9kca4"
              >
                <div className="flex items-center gap-1.5 mb-0.5" data-oid="rjf.xhm">
                  <Users className="w-3 h-3 text-emerald-500" data-oid="aftyioe" />
                  <span
                    className="text-base font-black text-slate-900 dark:text-white leading-none"
                    data-oid="vjn5e44"
                  >
                    1.2k
                  </span>
                </div>
                <span
                  className="text-[8px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="3am2o_2"
                >
                  Active Users
                </span>
              </div>
            </div>
          </div>

          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"
            data-oid="bvuv_6l"
          />
        </div>
      </m.div>
    </div>
  );
}
