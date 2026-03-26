import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Brain, BookOpen, ChevronRight, Crown, ArrowRight } from 'lucide-react';
import { VocabularyItem, User } from '@/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VocabularyProgress({
  initialItems = [],
  isLoading = false,
  vocabStats: propVocabStats,
}) {
  const vocabularyStats = useMemo(() => {
    if (propVocabStats) return propVocabStats;

    const totalWords = initialItems.length;
    const masteredWords = initialItems.filter(
      (item) =>
        (item.mastery_level && item.mastery_level >= 4) ||
        (item.times_reviewed && item.times_reviewed >= 5)
    ).length;
    const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

    return {
      totalWords,
      masteredWords,
      masteryPercentage,
    };
  }, [initialItems, propVocabStats]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-lg" data-oid="icjacnn">
        <CardContent className="p-5 sm:p-6" data-oid="tqdh1e7">
          <div className="animate-pulse space-y-4" data-oid="kdmmn:0">
            <div className="flex items-center gap-3" data-oid="ttg_v:g">
              <div className="w-12 h-12 bg-muted rounded-2xl" data-oid="3mddp0i"></div>
              <div className="h-6 bg-muted rounded w-48" data-oid="tgstxbn"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" data-oid="wdol.tn">
              <div className="space-y-2" data-oid="c:0z8tk">
                <div className="h-8 bg-muted rounded w-16" data-oid="9wqa3fb"></div>
                <div className="h-4 bg-muted rounded w-20" data-oid="ehoa701"></div>
              </div>
              <div className="space-y-2" data-oid="d2luf63">
                <div className="h-8 bg-muted rounded w-16" data-oid="jslb858"></div>
                <div className="h-4 bg-muted rounded w-20" data-oid="edmdk29"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      data-oid="s33c69i"
    >
      <Card
        className="relative rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white shadow-2xl shadow-indigo-500/5 overflow-hidden group dark:bg-slate-900/40 dark:backdrop-blur-xl"
        data-oid="l32_n3v"
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"
          data-oid="8sia7xi"
        />

        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="fche8mt"
        />

        <CardHeader className="pb-5 pt-6 px-5 sm:px-7" data-oid="xohgngo">
          <CardTitle
            className="flex items-center gap-4 text-slate-900 dark:text-white"
            data-oid="li19tm4"
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 transform group-hover:rotate-6 transition-transform duration-500"
              data-oid="ypvembq"
            >
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" data-oid="bih1eig" />
            </div>
            <div data-oid="1dl6::5">
              <span className="text-lg sm:text-xl font-black tracking-tight" data-oid="pv:fend">
                Vocabulary Mastery
              </span>
              <p
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5"
                data-oid="hqa2sws"
              >
                Focus & Retention
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent
          className="px-5 sm:px-7 pb-7 sm:pb-8 space-y-7 sm:space-y-8"
          data-oid="zwha8ly"
        >
          {/* Stats Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-oid="l1jz4pe">
            <div
              className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 relative group/stat flex flex-col items-center justify-center"
              data-oid="q:.ufl:"
            >
              <div
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1"
                data-oid="e3tnlmh"
              >
                {vocabularyStats.totalWords}
              </div>
              <div
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center"
                data-oid="-eiiel9"
              >
                Words Tracked
              </div>
            </div>

            <div
              className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 flex flex-col items-center justify-center"
              data-oid="ti5pgih"
            >
              <div
                className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1"
                data-oid="7z.pe.e"
              >
                {vocabularyStats.masteredWords}
              </div>
              <div
                className="text-[9px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest text-center"
                data-oid="cby0uuz"
              >
                Mastered
              </div>
            </div>
          </div>

          {/* Mastery Progress */}
          <div className="space-y-4" data-oid="vfr-4:7">
            <div
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1"
              data-oid="ju_n0y:"
            >
              <div className="space-y-1" data-oid="a6tjtc-">
                <span
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest block"
                  data-oid="b4.xh9g"
                >
                  Retention Progress
                </span>
                <div
                  className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                  data-oid="z26vjhv"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vocabularyStats.masteryPercentage}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                    data-oid=".w00164"
                  />
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums"
                data-oid="go.lu:9"
              >
                {vocabularyStats.masteryPercentage}
                <span className="text-sm text-slate-400 ml-0.5" data-oid="g15fwxt">
                  %
                </span>
              </div>
            </div>

            <div className="relative pt-2" data-oid="mhx2lri">
              <Progress
                value={vocabularyStats.masteryPercentage}
                aria-label="Vocabulary mastery progress"
                className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-white/5"
                data-oid="kwt6lul"
              />

              {/* Sparkle effect on current progress */}
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${vocabularyStats.masteryPercentage}%` }}
                className="absolute top-2 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] -ml-2 transition-all duration-500"
                data-oid="-j.8pgb"
              />
            </div>
          </div>

          {/* Practice Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} data-oid="fk:21:q">
            <Button
              asChild
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3 h-auto rounded-full shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-500 border-0 group/btn"
              data-oid="xvvmn.r"
            >
              <Link
                to={createPageUrl('Vocabulary')}
                className="flex items-center justify-center gap-3"
                data-oid="cibt_j7"
              >
                <div
                  className="w-6 h-6 rounded-full bg-white/10 dark:bg-slate-900/10 flex items-center justify-center group-hover/btn:rotate-12 transition-transform"
                  data-oid="xds7b08"
                >
                  <BookOpen className="w-3 h-3" data-oid="4tjx.or" />
                </div>
                EXERCISE NOW
                <ArrowRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  data-oid="ny26mbf"
                />
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
