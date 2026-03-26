import React from 'react';
import { m } from 'framer-motion';
import { CheckCircle2, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ComparisonSection() {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="mb-32 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-slate-200 dark:border-white/5 p-6 sm:p-8 md:p-16 overflow-hidden relative shadow-2xl"
    >
      <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="text-center mb-10 sm:mb-16 space-y-2 sm:space-y-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
          Expert Comparison
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
          A detailed look at why our Premium plan is the best value for serious candidates.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="h-12 flex items-center">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Efficiency
            </span>
          </div>
          <div className="h-12 flex items-center">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Feedback
            </span>
          </div>
          <div className="h-12 flex items-center">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Adaptive
            </span>
          </div>
        </div>

        {['Free', 'Pro', 'Premium'].map((tier, idx) => (
          <div
            key={tier}
            className={cn(
              'space-y-6 text-center p-4 sm:p-6 rounded-3xl transition-colors',
              tier === 'Premium' ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
            )}
          >
            <div className="h-12 flex items-center justify-center font-black text-lg">{tier}</div>
            <div className="h-12 flex items-center justify-center">
              <span className="text-sm font-bold">
                {idx === 0 ? 'Basic' : idx === 1 ? 'High' : 'Real-time'}
              </span>
            </div>
            <div className="h-12 flex items-center justify-center">
              <span className="text-sm font-bold">
                {idx === 0 ? 'Standard' : idx === 1 ? 'Detailed' : 'Instant AI'}
              </span>
            </div>
            <div className="h-12 flex items-center justify-center">
              {idx === 2 ? (
                <CheckCircle2 className="w-6 h-6 text-indigo-500 mx-auto" />
              ) : (
                <Minus className="w-5 h-5 text-slate-300 mx-auto" />
              )}
            </div>
          </div>
        ))}
      </div>
    </m.div>
  );
}
