import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Lock,
  BookOpen,
  GraduationCap,
  MessageSquare,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const KitVisual = ({ id }) => {
  if (id === 'default-kit-1' || id?.includes('writing')) {
    // Writing: Fountain Pen Nib over Academic Page with Star Sparkles
    return (
      <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="penGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EEF2FF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="6"
          width="18"
          height="22"
          rx="3"
          fill="url(#paperGrad)"
          stroke="#c7d2fe"
          strokeWidth="1.2"
        />
        <path
          d="M8 12h10M8 16h7M8 20h9"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M26 4L16 22l-4 1 1-4L23 2l3 2z"
          fill="url(#penGrad)"
          stroke="#3730a3"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="9" r="1" fill="#ffffff" />
        <path d="M27 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="#818cf8" />
      </svg>
    );
  }

  if (id === 'default-kit-2' || id?.includes('speaking')) {
    // Speaking: 3D Studio Mic with Sound Waves
    return (
      <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect
          x="11"
          y="5"
          width="10"
          height="15"
          rx="5"
          fill="url(#micGrad)"
          stroke="#047857"
          strokeWidth="1.2"
        />
        <path
          d="M7 14c0 4.97 4.03 9 9 9s9-4.03 9-9"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M16 23v5M12 28h8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="10" r="1.5" fill="#ffffff" opacity="0.8" />
        <path
          d="M4 14c0-3.5 1.5-6 3.5-7.5M28 14c0-3.5-1.5-6-3.5-7.5"
          stroke="#6ee7b7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id === 'default-kit-3' || id?.includes('reading')) {
    // Reading: Magnifying glass scanning academic text — IELTS Reading Comprehension
    return (
      <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {/* Page background */}
        <rect
          x="2"
          y="4"
          width="20"
          height="24"
          rx="2.5"
          fill="#EFF6FF"
          stroke="#BFDBFE"
          strokeWidth="0.8"
        />
        {/* Text lines on page */}
        <path
          d="M5 9h14M5 12h10M5 15h14M5 18h8"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Magnifying glass circle */}
        <circle cx="20" cy="20" r="8" fill="url(#lensGrad)" stroke="#0369a1" strokeWidth="1.2" />
        {/* Lens glass inner */}
        <circle cx="20" cy="20" r="5.2" fill="white" opacity="0.35" />
        {/* Lens highlight */}
        <path
          d="M17.5 17.5c1-1 2.5-1.2 3.5-.5"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Handle */}
        <path
          d="M26.5 26.5l-3.5-3.5"
          stroke="url(#handleGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Tiny text lines visible through lens */}
        <path
          d="M18 20h4M18 22.5h3"
          stroke="#0369a1"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );
  }

  // Academic / Fallback: Mortarboard Graduation Cap with Tassel
  return (
    <svg className="w-5.5 h-5.5 shrink-0" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M16 4L2 11l14 7 14-7L16 4z"
        fill="url(#capGrad)"
        stroke="#5b21b6"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M7 14.5v7.5c0 3 4 5 9 5s9-2 9-5v-7.5"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M26 12v10l2 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="12" r="1.5" fill="#f59e0b" />
    </svg>
  );
};

const THEMES = {
  indigo: {
    iconBg:
      'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300 shadow-sm',
    progressBar: 'bg-[#5661e9]',
  },
  emerald: {
    iconBg:
      'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 shadow-sm',
    progressBar: 'bg-emerald-500',
  },
  sky: {
    iconBg:
      'bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 shadow-sm',
    progressBar: 'bg-sky-500',
  },
  violet: {
    iconBg:
      'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 shadow-sm',
    progressBar: 'bg-violet-500',
  },
};

const DEFAULT_TOPIC_KITS = [
  {
    id: 'default-kit-1',
    title: 'IELTS Writing',
    description: 'High-impact words & academic phrases for Task 1 & 2',
    access_tier: 'pro',
    wordCount: 312,
    progressPercent: 72,
    theme: THEMES.indigo,
  },
  {
    id: 'default-kit-2',
    title: 'IELTS Speaking',
    description: 'Express complex ideas fluently and naturally in Parts 1-3',
    access_tier: 'free',
    wordCount: 258,
    progressPercent: 68,
    theme: THEMES.emerald,
  },
  {
    id: 'default-kit-3',
    title: 'IELTS Reading',
    description: 'Academic vocabulary & collocations for reading passages',
    access_tier: 'pro',
    wordCount: 356,
    progressPercent: 64,
    theme: THEMES.sky,
  },
  {
    id: 'default-kit-4',
    title: 'Academic Word List',
    description: 'Essential high-frequency vocabulary for Band 7.5+',
    access_tier: 'premium',
    wordCount: 570,
    progressPercent: 58,
    theme: THEMES.violet,
  },
];

const FALLBACK_THEMES = [THEMES.indigo, THEMES.emerald, THEMES.sky, THEMES.violet];

const WordGroupList = memo(({ curatedLists = [], user, onSelect, onViewAll }) => {
  const displayKits =
    curatedLists.length >= 4
      ? curatedLists.map((list, index) => ({
          id: list.id,
          title: list.title,
          description: list.description || 'Curated vocabulary list by IELTS experts.',
          access_tier: list.access_tier || 'free',
          wordCount: JSON.parse(list.content || '[]').length || 200,
          progressPercent: Math.min(
            100,
            Math.max(30, ((JSON.parse(list.content || '[]').length || 10) * 13) % 85)
          ),
          theme: FALLBACK_THEMES[index % FALLBACK_THEMES.length],
          rawList: list,
        }))
      : DEFAULT_TOPIC_KITS;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 shadow-xs">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smart Vocabulary Kits
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Curated word lists to boost your IELTS band score.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-[#5661e9] dark:text-indigo-300 gap-1 hover:bg-[#efedff] dark:hover:bg-indigo-950/50 rounded-xl h-8 px-2.5 transition-colors cursor-pointer"
          onClick={onViewAll}
        >
          View all kits <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Grid of Compact, High-Style Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {displayKits.map((kit) => {
          const hasAccess = () => {
            if (kit.access_tier === 'free') return true;
            if (!user) return false;
            const tiers = { free: 0, pro: 1, premium: 2 };
            return tiers[user.subscription_tier || 'free'] >= tiers[kit.access_tier];
          };
          const locked = !hasAccess();
          const theme = kit.theme || FALLBACK_THEMES[0];

          return (
            <motion.div
              key={kit.id}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => onSelect(kit.rawList || kit)}
              className="group relative rounded-[20px] bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] border border-[#e0e4f1] dark:border-white/10 p-4 shadow-xs hover:shadow-md hover:border-[#6570ee]/50 dark:hover:border-indigo-400/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header Row: Icon & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                    >
                      <KitVisual id={kit.id} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-[#5661e9] dark:group-hover:text-indigo-400 transition-colors truncate">
                        {kit.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                        {kit.wordCount} words
                      </span>
                    </div>
                  </div>

                  {/* Tier / Lock Badge */}
                  {locked ? (
                    <Badge className="bg-slate-900 text-amber-400 border border-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="uppercase">{kit.access_tier}</span>
                    </Badge>
                  ) : kit.access_tier !== 'free' ? (
                    <Badge className="bg-[#efedff] text-[#505bdd] dark:bg-indigo-950 dark:text-indigo-300 border border-[#d8dcfa] dark:border-indigo-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0">
                      {kit.access_tier}
                    </Badge>
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-1">
                  {kit.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 mt-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    PROGRESS
                  </span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-xs">
                    {kit.progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#eceef8] dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${theme.progressBar} transition-all duration-500 ease-out`}
                    style={{ width: `${kit.progressPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

WordGroupList.displayName = 'WordGroupList';

export default WordGroupList;
