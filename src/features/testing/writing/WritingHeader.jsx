import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award, PenTool, Users } from 'lucide-react';

export default function WritingHeader({ totalPassages }) {
  return (
    <div
      className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 dark:from-orange-500/5 dark:via-transparent dark:to-amber-500/5 backdrop-blur-3xl shadow-xl shadow-orange-500/10 dark:shadow-orange-500/20"
      data-oid="gkyc.o."
    >
      <div
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/5 to-transparent -z-10"
        data-oid="6m1s7rb"
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
        data-oid="ogrgxnp"
      />

      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
        data-oid="jz4eiud"
      >
        <div className="space-y-4 max-w-2xl" data-oid="3cn5nhl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-600/5 dark:bg-orange-400/10 border border-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
            data-oid="1lrleuj"
          >
            <Sparkles className="w-3 h-3" data-oid="kyxhk4b" />
            <span data-oid="abvnsmn">Premium Writing Hub</span>
          </motion.div>

          <div className="space-y-2" data-oid="4za07ag">
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
              data-oid="ex2pcv4"
            >
              Writing{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 dark:from-orange-400 dark:via-amber-400 dark:to-red-400"
                data-oid="hu7lx0z"
              >
                Library
              </span>
            </h1>
            <p
              className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
              data-oid="x09z8xk"
            >
              Master IELTS writing with structured tasks, expert templates, and instant AI feedback.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center" data-oid="gkcxyyh">
            <div
              className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
              data-oid="_ckibxb"
            >
              <div
                className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"
                data-oid="e35ge7a"
              >
                <TrendingUp className="w-4 h-4" data-oid="lu6guoq" />
              </div>
              <div className="flex flex-col" data-oid="zgmhd-y">
                <h4
                  className="text-base font-black text-slate-900 dark:text-white leading-none"
                  data-oid="jppg-gk"
                >
                  84%
                </h4>
                <span
                  className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="-6n1jox"
                >
                  Success
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
              data-oid="956p-9h"
            >
              <div
                className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                data-oid="1cyl3no"
              >
                <Award className="w-4 h-4" data-oid=":lw_fwx" />
              </div>
              <div className="flex flex-col" data-oid="ofw1mrg">
                <h4
                  className="text-base font-black text-slate-900 dark:text-white leading-none"
                  data-oid="bgtmq6r"
                >
                  Official
                </h4>
                <span
                  className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="3hf0qci"
                >
                  Content
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Library Insights Card */}
        <div className="lg:block hidden" data-oid="g0vddyu">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative p-1"
            data-oid="hhbcfg4"
          >
            <div
              className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
              data-oid="o9pvfq6"
            />
            <div
              className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
              data-oid="z814.-x"
            >
              <div className="space-y-3" data-oid="pci6i0b">
                <div className="flex flex-col" data-oid="qnh0te3">
                  <span
                    className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1"
                    data-oid="5bhcwh4"
                  >
                    Weekly Target
                  </span>
                  <h4
                    className="text-xl font-black text-slate-900 dark:text-white"
                    data-oid="1gevuh8"
                  >
                    Writing Mastery
                  </h4>
                </div>
                <div className="space-y-3" data-oid="jx_vzhm">
                  <div className="flex justify-between items-end" data-oid="mchgupj">
                    <span className="text-xs font-bold text-slate-500" data-oid="z0zrf-k">
                      5 of 8 Tasks Completed
                    </span>
                    <span className="text-sm font-black text-orange-600" data-oid="gp-fug5">
                      62%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
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
                <div className="grid grid-cols-2 gap-3 pt-2" data-oid="daej..l">
                  <div
                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                    data-oid="cnnh6.1"
                  >
                    <div className="flex items-center gap-2 mb-1" data-oid="0a0zvcr">
                      <PenTool className="w-3.5 h-3.5 text-orange-500" data-oid=":.hyqn1" />
                      <span
                        className="text-lg font-black text-slate-900 dark:text-white leading-none"
                        data-oid="-bxrars"
                      >
                        {totalPassages}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="a7ap65r"
                    >
                      Total Tasks
                    </span>
                  </div>
                  <div
                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                    data-oid="drrq14y"
                  >
                    <div className="flex items-center gap-2 mb-1" data-oid="y98-ao3">
                      <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="np7k8t3" />
                      <span
                        className="text-lg font-black text-slate-900 dark:text-white leading-none"
                        data-oid=".b9ybq2"
                      >
                        1.8k
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="2u2h-8x"
                    >
                      Active Users
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"
                data-oid="cvc4tb6"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
