import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Zap,
  BookOpen,
  Headphones,
  PenTool,
  Mic2,
  Calendar,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from 'react-router-dom';

const TYPE_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic2,
};

const TYPE_COLORS = {
  reading: 'text-sky-600 bg-sky-50 dark:bg-sky-500/20 dark:text-sky-300 ring-1 ring-sky-200/70',
  listening:
    'text-[#5a63df] bg-[#5a63df]/10 dark:bg-[#5a63df]/20 dark:text-[#a9afff] ring-1 ring-[#5a63df]/20',
  writing:
    'text-amber-600 bg-amber-50 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-200/70',
  speaking:
    'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200/70',
};

const CATEGORY_META = {
  rushed: {
    title: 'Rushed answers',
    description: 'Wrong answers given in 20 seconds or less.',
    icon: Zap,
    badgeBg:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-200/70',
  },
  overanalyzed: {
    title: 'Overthought answers',
    description: 'Wrong answers that took 2.5 minutes or more.',
    icon: Clock,
    badgeBg:
      'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff] ring-1 ring-[#5a63df]/20',
  },
  nearMisses: {
    title: 'Near misses',
    description: 'Small mistakes on questions you nearly had right.',
    icon: TrendingDown,
    badgeBg:
      'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff] ring-1 ring-[#5a63df]/20',
  },
  unanswered: {
    title: 'Left blank',
    description: 'IELTS has no negative marking — always pick an answer.',
    icon: Calendar,
    badgeBg:
      'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-200/70',
  },
};

export default function ErrorDrilldownModal({ isOpen, onClose, category, data = [] }) {
  const meta = CATEGORY_META[category] || {
    title: 'Session detail',
    description: 'The sessions behind this pattern.',
    icon: Zap,
    badgeBg:
      'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff] ring-1 ring-[#5a63df]/20',
  };

  const Icon = meta.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1.5rem)] overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-0 dark:border-white/10 dark:bg-[#131315] sm:max-w-[500px]">
        <DialogHeader className="border-b border-[#eceafa] px-4 py-3.5 text-left dark:border-white/[0.07] sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                {meta.title}
              </DialogTitle>
              <DialogDescription className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {meta.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] p-3.5 sm:p-4">
          <div className="space-y-2">
            {data.length > 0 ? (
              data.map((session, index) => {
                const typeKey = (session.type || 'reading').toLowerCase();
                const TypeIcon = TYPE_ICONS[typeKey] || BookOpen;
                const typeStyle = TYPE_COLORS[typeKey] || TYPE_COLORS.reading;
                const getReviewUrl = (s) => {
                  const typeMap = {
                    reading: 'reading-test',
                    listening: 'listening-test',
                    speaking: 'speaking-test',
                    writing: 'writing-task',
                  };
                  const path = typeMap[typeKey] || 'reading-test';
                  return `/${path}/${s.id}?view-results=true`;
                };

                const dateStr = session.date
                  ? new Date(session.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <motion.div
                    key={`${session.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/[0.15]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs',
                          typeStyle
                        )}
                      >
                        <TypeIcon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-black text-slate-950 dark:text-white capitalize truncate">
                            {session.type}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            • {dateStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant="outline"
                            className={cn('text-[9px] font-black border-0 px-2 py-0', meta.badgeBg)}
                          >
                            {session.count}{' '}
                            {category === 'rushed'
                              ? 'rushed'
                              : category === 'overanalyzed'
                                ? 'overanalyzed'
                                : category === 'nearMisses'
                                  ? 'near misses'
                                  : category === 'unanswered'
                                    ? 'left blank'
                                    : 'issues'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-950 dark:text-white block leading-none">
                          {session.score != null ? session.score : '—'}
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Band
                        </span>
                      </div>

                      <Link
                        to={getReviewUrl(session)}
                        onClick={onClose}
                        className="inline-flex cursor-pointer items-center gap-0.5 rounded-md bg-[#5a63df]/10 px-2.5 py-1 text-xs font-black text-[#5a63df] transition-all hover:bg-[#5a63df]/20 dark:bg-[#5a63df]/20 dark:text-[#a9afff]"
                      >
                        Review <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  No sessions found for this category.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
