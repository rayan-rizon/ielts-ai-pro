import React from 'react';
import { m } from 'framer-motion';
import { BookOpen, Sparkles, TrendingUp, Award, Users } from 'lucide-react';

// ---------------------------------------------------------------------------
// Reading page hero header — static stats + title
// ---------------------------------------------------------------------------

export default function ReadingHeader({ totalPassages }) {
  return (
    <div
      className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-blue-500/5 dark:via-transparent dark:to-indigo-500/5 backdrop-blur-3xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20"
      data-oid="q3yh4__"
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent -z-10"
        data-oid="1cwgv0f"
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
        data-oid="1_5wycc"
      />

      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
        data-oid="p.3vb3x"
      >
        {/* Left: title + description + stats */}
        <div className="space-y-4 max-w-2xl" data-oid="ihd0sbo">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/5 dark:bg-blue-400/10 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
            data-oid="q:ms_70"
          >
            <Sparkles className="w-3 h-3" data-oid="agv7rce" />
            <span data-oid="eoq63i.">Premium Practice Hub</span>
          </m.div>

          <div className="space-y-2" data-oid="50ypi0v">
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
              data-oid="fohbhse"
            >
              Reading{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400"
                data-oid="fz_0bs2"
              >
                Library
              </span>
            </h1>
            <p
              className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
              data-oid="5-rlh65"
            >
              Master the IELTS Reading section with our authentic, Cambridge-style practice
              materials.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center" data-oid="xlv0qgd">
            <div
              className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
              data-oid="wwgtu11"
            >
              <div
                className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
                data-oid="-vtnkg0"
              >
                <TrendingUp className="w-4 h-4" data-oid="dr53sd9" />
              </div>
              <div className="flex flex-col" data-oid="8z53chw">
                <h4
                  className="text-base font-black text-slate-900 dark:text-white leading-none"
                  data-oid="vfb_aoe"
                >
                  87%
                </h4>
                <span
                  className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="gyv::x2"
                >
                  Success
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
              data-oid="z4r_-cf"
            >
              <div
                className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                data-oid="7v0.68k"
              >
                <Award className="w-4 h-4" data-oid="k9fs:i8" />
              </div>
              <div className="flex flex-col" data-oid="e7lr5:g">
                <h4
                  className="text-base font-black text-slate-900 dark:text-white leading-none"
                  data-oid="s-jacan"
                >
                  Official
                </h4>
                <span
                  className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                  data-oid="gydfxgz"
                >
                  Content
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mastery Progress Card */}
        <div className="lg:block hidden" data-oid="16_8cht">
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative p-1"
            data-oid="6zifozt"
          >
            <div
              className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
              data-oid="9y-amia"
            />
            <div
              className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
              data-oid="6d2v9jr"
            >
              <div className="absolute top-0 right-0 p-4" data-oid="393o.gg">
                <div
                  className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
                  data-oid=":u.0rv2"
                >
                  <BookOpen
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    data-oid="dhqluy5"
                  />
                </div>
              </div>

              <div className="space-y-3" data-oid="72nwm1n">
                <div className="flex flex-col" data-oid="q_tpwyo">
                  <span
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1"
                    data-oid=".pg4_8y"
                  >
                    Weekly Target
                  </span>
                  <h4
                    className="text-xl font-black text-slate-900 dark:text-white"
                    data-oid="rhi41c1"
                  >
                    Mastery Progress
                  </h4>
                </div>

                <div className="space-y-3" data-oid="c1.n3a3">
                  <div className="flex justify-between items-end" data-oid="z6zbqet">
                    <span className="text-xs font-bold text-slate-500" data-oid="16ffq.h">
                      6 of 10 Tests Completed
                    </span>
                    <span className="text-sm font-black text-blue-600" data-oid="vfo1y-4">
                      60%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
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

                <div className="grid grid-cols-2 gap-3 pt-2" data-oid="w92129j">
                  <div
                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                    data-oid="z0k-p_y"
                  >
                    <div className="flex items-center gap-2 mb-1" data-oid="oy33w-d">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" data-oid="qrk0pgc" />
                      <span
                        className="text-lg font-black text-slate-900 dark:text-white leading-none"
                        data-oid="k4f:iyv"
                      >
                        {totalPassages}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="tf3.7fb"
                    >
                      Total Tests
                    </span>
                  </div>
                  <div
                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                    data-oid="fk9kca4"
                  >
                    <div className="flex items-center gap-2 mb-1" data-oid="rjf.xhm">
                      <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="aftyioe" />
                      <span
                        className="text-lg font-black text-slate-900 dark:text-white leading-none"
                        data-oid="vjn5e44"
                      >
                        1.2k
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
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
      </div>
    </div>
  );
}
