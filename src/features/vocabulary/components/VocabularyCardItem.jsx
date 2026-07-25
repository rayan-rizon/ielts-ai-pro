import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { playPronunciation } from '../utils/audioUtils';
import { getPartOfSpeech, getMemoryStrength } from './vocabularyUtils';

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
          'h-7.5 w-7.5 rounded-xl transition-all cursor-pointer',
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
        className="h-7.5 w-7.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        onClick={handleDelete}
        title="Delete Word"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

const CardMemoryFooter = ({ source, memory }) => (
  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 mt-1">
    <div className="flex items-center justify-between text-[10px] font-bold">
      <Badge
        variant="outline"
        className="text-[9px] font-bold text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 px-2 py-0.5 rounded-md"
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

    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
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
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-[#635BFF] dark:hover:border-indigo-700 transition-all duration-200 flex flex-col justify-between space-y-3 group relative overflow-hidden cursor-pointer"
      onClick={() => onViewWord(item)}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                {item.word}
              </h4>
              <button
                onClick={handleSpeak}
                className={cn(
                  'p-1 rounded-lg text-slate-400 hover:text-[#635BFF] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer',
                  isPlayingAudio && 'text-[#635BFF] animate-pulse bg-indigo-50'
                )}
                title="Listen audio pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400">
                {item.ipa || `/${item.word}/`}
              </span>
              <Badge
                variant="outline"
                className="bg-indigo-50/80 dark:bg-indigo-950/60 text-[#635BFF] dark:text-indigo-300 border-none rounded-md px-2 py-0 text-[10px] font-black uppercase tracking-wider"
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

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
          {item.definition}
        </p>
      </div>

      <CardMemoryFooter source={item.source} memory={memory} />
    </motion.div>
  );
});

VocabularyCardItem.displayName = 'VocabularyCardItem';
