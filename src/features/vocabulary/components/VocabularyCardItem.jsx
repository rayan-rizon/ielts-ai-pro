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
  <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 mt-1">
    <div className="flex items-center justify-between text-[10px] font-bold">
      <Badge
        variant="outline"
        className="text-[9px] font-bold text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-white/10 px-2 py-0.5 rounded-md"
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

    <div className="w-full h-1.5 bg-[#eceef8] dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-[#5661e9] transition-all duration-500"
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
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="p-4 sm:p-4.5 rounded-[20px] bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] border border-[#e0e4f1] dark:border-white/10 shadow-xs hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] hover:border-[#6570ee]/40 transition-all duration-200 flex flex-col justify-between space-y-3.5 group relative overflow-hidden cursor-pointer"
      onClick={() => onViewWord(item)}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-[#5661e9] dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                {item.word}
              </h4>
              <button
                onClick={handleSpeak}
                className={cn(
                  'p-1.5 rounded-xl text-slate-400 hover:text-[#5661e9] dark:hover:text-indigo-300 hover:bg-[#efedff] dark:hover:bg-indigo-500/20 transition-colors shrink-0 cursor-pointer',
                  isPlayingAudio && 'text-[#5661e9] animate-pulse bg-[#efedff]'
                )}
                title="Listen audio pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                {item.ipa || `/${item.word}/`}
              </span>
              <Badge
                variant="outline"
                className="bg-[#efedff] dark:bg-indigo-500/20 text-[#505bdd] dark:text-indigo-300 border-none rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
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
