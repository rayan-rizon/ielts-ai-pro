import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export const BandScoreHero = React.memo(({ testResults, getAssessmentMessage }) => (
  <div
    className="flex flex-col items-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/80 p-4 md:p-5 shadow-sm"
    data-oid="j1qb-nz"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex flex-col items-center gap-2 mb-3"
      data-oid=".:enlg1"
    >
      <div
        className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25"
        data-oid="5q-d537"
      >
        <span className="text-3xl sm:text-4xl font-black text-white" data-oid="p1_zjyy">
          {parseFloat(testResults.bandScore).toFixed(1)}
        </span>
        <span className="text-base font-bold text-blue-100/80 tracking-widest" data-oid="46zsjnp">
          Band
        </span>
      </div>

      {testResults.previousBandScore != null && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
            parseFloat(testResults.bandScore) > testResults.previousBandScore
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : parseFloat(testResults.bandScore) < testResults.previousBandScore
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          )}
          data-oid="jhz2eze"
        >
          {parseFloat(testResults.bandScore) > testResults.previousBandScore ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" data-oid="av396do" />+
              {(parseFloat(testResults.bandScore) - testResults.previousBandScore).toFixed(1)} from
              last
            </>
          ) : parseFloat(testResults.bandScore) < testResults.previousBandScore ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 rotate-180" data-oid="9nz4flb" />
              {(parseFloat(testResults.bandScore) - testResults.previousBandScore).toFixed(1)} from
              last
            </>
          ) : (
            <>
              <span data-oid="7gtol6_">→</span>Same as last
            </>
          )}
        </motion.div>
      )}
    </motion.div>

    <div
      className="text-center px-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300"
      data-oid="_kx3xye"
    >
      <p
        className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed"
        data-oid="n0fik82"
      >
        {getAssessmentMessage(parseFloat(testResults.bandScore))}
      </p>
    </div>
  </div>
));

BandScoreHero.displayName = 'BandScoreHero';
