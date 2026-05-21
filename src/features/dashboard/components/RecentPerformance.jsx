import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Headphones,
  LayoutDashboard,
  Mic,
  PenTool,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBand } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

export default function RecentPerformance({ recentTests }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col',
        'bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl',
        'border border-white/60 dark:border-white/[0.12]',
        'shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        'hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)]',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
      data-oid="if37x9n"
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
        data-oid=".kt7gp1"
      />

      <CardHeader className="p-4 md:p-5 pb-0 relative z-10" data-oid="h3824or">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-oid="t04mrrc"
        >
          <CardTitle
            className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="h:ij4g_"
          >
            <div
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-transform group-hover:rotate-12"
              data-oid="j4p.75b"
            >
              <Calendar
                className="w-4 h-4 transition-transform duration-500 group-hover:scale-110"
                data-oid="j1joidz"
              />
            </div>
            <div data-oid="t_v_6vf">
              <span className="tracking-tight" data-oid="o:z-f98">
                Recent Activity
              </span>
              <p
                className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5"
                data-oid="ey_43es"
              >
                PERFORMANCE LOG
              </p>
            </div>
          </CardTitle>
          <motion.button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 w-full sm:w-auto justify-center"
            data-oid="95jw159"
          >
            {expanded ? 'Collapse' : 'Expand'}
            <ChevronDown
              className={cn(
                'w-2.5 h-2.5 transition-transform duration-300',
                expanded && 'rotate-180'
              )}
              data-oid="mnm6c.q"
            />
          </motion.button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 pt-3 flex-1 flex flex-col" data-oid="h1q:q:o">
        <AnimatePresence initial={false} data-oid="6z61j-l">
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'linear' }}
              className="overflow-hidden"
              data-oid="galfkj:"
            >
              <div className="space-y-3 mt-1" data-oid="9rh9qt0">
                {recentTests.length ? (
                  recentTests.slice(0, 5).map((session, idx) => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="group/item p-3.5 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl relative overflow-hidden"
                      data-oid=".sqc.oe"
                    >
                      {/* Gradient Accent on Hover */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/item:bg-gradient-to-b from-indigo-500 to-purple-500 transition-all duration-300"
                        data-oid="7qqb4ag"
                      />

                      <div
                        className="flex items-center gap-4 min-w-0 w-full sm:w-auto"
                        data-oid="lk3c_mh"
                      >
                        {/* Score Badge */}
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800',
                            session.test_type?.toLowerCase() === 'reading'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : session.test_type?.toLowerCase() === 'listening'
                                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          )}
                          data-oid="g3f55qv"
                        >
                          <span className="text-sm font-black leading-none" data-oid="gkku2eq">
                            {formatBand(session.score)}
                          </span>
                          <span
                            className="text-[7px] font-bold uppercase tracking-tighter opacity-70"
                            data-oid="onqji2p"
                          >
                            Band
                          </span>
                        </div>

                        <div className="min-w-0" data-oid="l3ja:bv">
                          <div
                            className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2"
                            data-oid="mcmd-50"
                          >
                            {session.test_type} Test
                            {/* Optional: Add 'New' badge if very recent */}
                          </div>
                          <div className="flex items-center gap-3 mt-1" data-oid="jceh4rt">
                            <div
                              className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400"
                              data-oid="t4x37gt"
                            >
                              <Calendar className="w-3 h-3" data-oid="x8-wcpd" />
                              {session.completed_at
                                ? new Date(session.completed_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Recently'}
                            </div>
                            {/* Questions Correct Stat if available in content_data */}
                            {session.content_data?.correctAnswers !== undefined &&
                              session.content_data?.totalQuestions && (
                                <div
                                  className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 pl-3 border-l border-slate-200 dark:border-slate-800"
                                  data-oid="jpoz1ax"
                                >
                                  <Target className="w-3 h-3" data-oid="sxmu:1m" />
                                  {session.content_data.correctAnswers}/
                                  {session.content_data.totalQuestions}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-3 w-full sm:w-auto justify-end"
                        data-oid="2zjhk8x"
                      >
                        {session.content_data?.percentage !== undefined && (
                          <div className="text-right hidden sm:block mr-2" data-oid="m_aurk0">
                            <div
                              className="text-xs font-bold text-slate-900 dark:text-white"
                              data-oid=":t1o7au"
                            >
                              {session.content_data.percentage}%
                            </div>
                            <div
                              className="text-[8px] font-medium text-slate-500 dark:text-slate-400 uppercase"
                              data-oid="66go_5t"
                            >
                              Accuracy
                            </div>
                          </div>
                        )}

                        <Button
                          asChild
                          variant="ghost"
                          className="h-9 px-4 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm hover:shadow-indigo-500/20 border border-indigo-100 dark:border-indigo-900/30"
                          data-oid="jx12vt3"
                        >
                          <Link
                            to={`/${session.test_type}-test/${session.id}?view-results=true`}
                            data-oid="h7yler8"
                          >
                            Review
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" data-oid="_oyalua" />
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div
                    className="py-10 flex flex-col items-center justify-center text-center"
                    data-oid="qj2--0o"
                  >
                    <div
                      className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3"
                      data-oid="o:hvih1"
                    >
                      <LayoutDashboard className="w-5 h-5 text-slate-300" data-oid="t35t.35" />
                    </div>
                    <h4
                      className="text-sm font-black text-slate-900 dark:text-white"
                      data-oid="7gsql3j"
                    >
                      No data yet
                    </h4>
                    <p
                      className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[200px] mt-1"
                      data-oid="6xmywiy"
                    >
                      Complete your first test to see your log here.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
