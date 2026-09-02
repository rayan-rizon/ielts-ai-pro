import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { m } from 'framer-motion';
import { playPronunciation } from '../utils/audioUtils';
import { getPartOfSpeech, getMemoryStrength } from './vocabularyUtils';
import { TILE } from '@/features/dashboard/components/primitives';

const CardHeaderActions = ({ item, onToggleMastery, onDeleteWord }) => {
  const isMastered = (item.mastery_level || 0) >= 4;

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleMastery(item.id, item.mastery_level || 0);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteWord(item.id);
  };

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          'h-11 w-11 rounded-xl transition-all cursor-pointer',
          isMastered
            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
        )}
        onClick={handleToggle}
        title={isMastered ? 'Mastered' : 'Mark as mastered'}
      >
        <Star className={cn('w-3.5 h-3.5', isMastered && 'fill-current text-amber-500')} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        onClick={handleDelete}
        title="Delete Word"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

const CardMemoryFooter = ({ source, memory }) => (
  <div className="mt-1 space-y-1.5 border-t border-[#eeedf7] pt-2.5 dark:border-white/10">
    <div className="flex items-center justify-between text-[10px] font-bold">
      <Badge
        variant="outline"
        className="rounded-md border-[#e2e5f2] px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400"
      >
        {source || 'Academic'}
      </Badge>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
          {memory.label}
        </span>
        <span className="text-[11px] font-black text-slate-900 dark:text-white">
          {memory.percent}%
        </span>
      </div>
    </div>

    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f4f3fb] dark:bg-white/10">
      <div
        className="h-full rounded-full bg-[#5a63df] transition-all duration-500"
        style={{ width: `${memory.percent}%` }}
      />
    </div>
  </div>
);

export const VocabularyCardItem = memo(({ item, onViewWord, onToggleMastery, onDeleteWord }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const memory = getMemoryStrength(item.mastery_level || 0);

  const handleSpeak = (e) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPronunciation(item.word).finally(() => setIsPlayingAudio(false));
  };

  const pos = getPartOfSpeech(item);

  return (
    <m.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        TILE,
        'group relative flex cursor-pointer flex-col justify-between space-y-3 overflow-hidden p-4 transition-all duration-200 hover:border-[#c9cdf3] hover:shadow-sm dark:hover:border-white/20'
      )}
      onClick={() => onViewWord(item)}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-indigo-400">
                {item.word}
              </h4>
              <button
                onClick={handleSpeak}
                className={cn(
                  'shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#5a63df]/10 hover:text-[#5a63df]',
                  isPlayingAudio && 'animate-pulse bg-[#5a63df]/10 text-[#5a63df]'
                )}
                title="Listen audio pronunciation"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                {item.ipa || `/${item.word}/`}
              </span>
              <Badge
                variant="outline"
                className="rounded-md border-none bg-[#5a63df]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-300"
              >
                {pos}
              </Badge>
            </div>
          </div>

          <CardHeaderActions
            item={item}
            onToggleMastery={onToggleMastery}
            onDeleteWord={onDeleteWord}
          />
        </div>

        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          {item.definition}
        </p>
      </div>

      <CardMemoryFooter source={item.source} memory={memory} />
    </m.div>
  );
});

VocabularyCardItem.displayName = 'VocabularyCardItem';
