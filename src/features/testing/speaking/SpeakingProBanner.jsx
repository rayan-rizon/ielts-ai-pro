import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

// Extract the conditional check into a named function to reduce CC
function isFreeTier(userData) {
  if (!userData) return false;
  return (userData.subscription_tier || 'free').toLowerCase() === 'free';
}

export default function SpeakingProBanner({ userData }) {
  if (!isFreeTier(userData)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group mt-2"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-duration-500" />

      <div className="relative overflow-hidden rounded-[2rem] border border-rose-200/50 dark:border-rose-500/20 bg-white/50 dark:bg-[#121212]/80 backdrop-blur-2xl p-1 shadow-2xl shadow-rose-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-[1.8rem] bg-white/40 dark:bg-white/5">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-500 blur-lg opacity-40 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/20 dark:to-orange-500/20 border border-rose-100 dark:border-rose-500/30 flex items-center justify-center">
                <Crown className="w-8 h-8 text-rose-500 dark:text-rose-400 fill-current" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Unlock Speaking Mastery <span className="hidden md:inline-block">🚀</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                Get{' '}
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  unlimited AI evaluations
                </span>
                , instant band scores (0-9), and deeper insights to ace your IELTS Speaking test.
              </p>
            </div>
          </div>

          <Link to={createPageUrl('Pricing')} className="flex-shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto h-12 md:h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-base shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all border border-transparent group/btn">
              Upgrade Now <Sparkles className="w-4 h-4 ml-2 group-hover/btn:animate-spin-slow" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
