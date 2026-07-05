import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OnboardingCard({ showOnboarding, onboardingSteps, dismissOnboarding }) {
  return (
    <AnimatePresence data-oid="-ssfzh.">
      {showOnboarding && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          data-oid="x3kli3j"
        >
          <Card
            className={cn(
              'relative rounded-2xl transition-all duration-300 overflow-hidden group',
              'bg-white dark:bg-slate-900',
              'border border-slate-200 dark:border-slate-800',
              'shadow-sm'
            )}
            data-oid="0cd6e-7"
          >
            {/* Decorative pattern */}
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"
              data-oid="uz8tnyn"
            />

            <CardHeader className="p-5 sm:p-6 pb-2" data-oid="q9tl4fw">
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                data-oid="74g:2yc"
              >
                <div className="flex items-center gap-3" data-oid="wsx3mj.">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center"
                    data-oid="kmh8:ie"
                  >
                    <BadgeCheck className="w-5 h-5 text-emerald-500" data-oid="znyd6tt" />
                  </div>
                  <div data-oid="mmzlzfi">
                    <CardTitle
                      className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight"
                      data-oid="ynjuz_y"
                    >
                      Quick Start
                    </CardTitle>
                    <p
                      className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5"
                      data-oid="2bh7m_q"
                    >
                      Setup Guide
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-full sm:w-auto"
                  onClick={dismissOnboarding}
                  data-oid="9aq1wiq"
                >
                  Dismiss
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-4 space-y-3" data-oid="b8_c67_">
              {onboardingSteps.slice(0, 2).map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    'p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group/item shadow-sm',
                    step.done
                      ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100/50 dark:border-emerald-500/10'
                      : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-emerald-500/20 hover:shadow-md'
                  )}
                  data-oid="7wwlqrx"
                >
                  <div className="min-w-0 relative z-10 w-full" data-oid="b1gy6tt">
                    <div
                      className="text-[13px] font-black text-slate-900 dark:text-white flex items-center gap-2"
                      data-oid="6q8w.4l"
                    >
                      {step.done ? (
                        <div
                          className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                          data-oid="70:bqc1"
                        >
                          <BadgeCheck className="w-3.5 h-3.5 text-white" data-oid="s2tcpfj" />
                        </div>
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 font-black text-[9px] flex items-center justify-center text-slate-500 dark:text-slate-400"
                          data-oid="m6bjp4p"
                        >
                          {idx + 1}
                        </div>
                      )}
                      {step.title}
                    </div>
                    <div
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1 tracking-tight px-7 opacity-80"
                      data-oid="g-kx7xm"
                    >
                      {step.description}
                    </div>
                  </div>
                  {!step.done && (
                    <Button
                      asChild
                      size="sm"
                      className="relative z-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-4 h-8 text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                      data-oid="-9avllp"
                    >
                      <Link to={step.href} data-oid=":3gav2i">
                        START
                      </Link>
                    </Button>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
