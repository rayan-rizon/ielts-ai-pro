import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Languages, Volume2, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { playPronunciation } from '../utils/audioUtils';
import { getItemTranslation } from '../utils/vocabCard';
import { getPartOfSpeech, getMemoryStrength } from './vocabularyUtils';

const DefinitionCell = ({ item, targetLanguage }) => {
  // The AI card stores the meaning in the learner's language; nothing is
  // machine-translated on the fly, so a word without it shows no second line.
  const translatedDef = getItemTranslation(item, targetLanguage)?.meaning;

  return (
    <td className="px-4 py-3.5">
      <div className="max-w-lg space-y-1">
        <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-sm">
          {item.definition}
        </p>
        {translatedDef && (
          <div className="flex items-start gap-1.5 pt-0.5">
            <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
            <span
              lang={targetLanguage}
              className="line-clamp-2 rounded-md bg-[#5a63df]/10 px-2 py-0.5 text-xs font-semibold text-[#5a63df] dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {translatedDef}
            </span>
          </div>
        )}
      </div>
    </td>
  );
};

const MemoryMeterCell = ({ item }) => {
  const memory = getMemoryStrength(item);
  const hasScore = memory.percent != null;
  return (
    <td className="px-3 py-3.5">
      <div
        className="flex flex-col items-center gap-1 w-24 mx-auto"
        title={
          hasScore
            ? `Reviewed ${memory.reviews} time${memory.reviews === 1 ? '' : 's'}`
            : 'No reviews recorded yet'
        }
      >
        <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-700 dark:text-slate-300">
          <span>{memory.label}</span>
          <span>{hasScore ? `${memory.percent}%` : '—'}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', memory.color)}
            style={{ width: `${memory.percent ?? 0}%` }}
          />
        </div>
      </div>
    </td>
  );
};

const TableRowActionsCell = ({ item, onViewWord, onToggleMastery, onDeleteWord }) => {
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
    <td className="px-4 py-3.5 text-right">
      <div className="flex items-center justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'h-11 w-11 rounded-lg transition-all',
            isMastered
              ? 'text-amber-500 hover:bg-amber-500/10'
              : 'text-slate-400 hover:text-amber-500'
          )}
          onClick={handleToggle}
          title="Toggle Favorite/Mastery"
        >
          <Star className={cn('w-4 h-4', isMastered && 'fill-current')} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-lg text-slate-500 hover:text-[#5a63df]"
          onClick={() => onViewWord(item)}
          title="View Detail"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-lg text-slate-400 hover:text-rose-500"
          onClick={handleDelete}
          title="Delete Word"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </td>
  );
};

export const VocabularyTableRow = memo(
  ({ item, onViewWord, onToggleMastery, onDeleteWord, targetLanguage }) => {
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const handleSpeak = (e) => {
      e.stopPropagation();
      setIsPlayingAudio(true);
      playPronunciation(item.word).finally(() => setIsPlayingAudio(false));
    };

    const pos = getPartOfSpeech(item);

    return (
      <tr className="border-b border-[#ebeaf7] transition-colors hover:bg-[#f4f3fb] dark:border-white/10 dark:hover:bg-white/5">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSpeak}
              className={cn(
                'shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#5a63df]/10 hover:text-[#5a63df]',
                isPlayingAudio && 'animate-pulse bg-[#5a63df]/10 text-[#5a63df]'
              )}
              title="Listen audio pronunciation"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className="cursor-pointer text-sm font-black italic text-slate-900 transition-colors hover:text-[#5a63df] dark:text-white dark:hover:text-indigo-400 sm:text-base"
                onClick={() => onViewWord(item)}
              >
                {item.word}
              </span>
              <span className="font-sans text-xs font-semibold text-slate-600 dark:text-slate-300">
                {item.ipa || ''}
              </span>
            </div>
          </div>
        </td>

        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="rounded-lg border-[#e2e5f2] bg-[#f4f3fb] px-2 py-0.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            {pos}
          </Badge>
        </td>

        <DefinitionCell item={item} targetLanguage={targetLanguage} />

        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="border-[#5a63df]/20 bg-[#5a63df]/10 px-2.5 py-0.5 text-xs font-bold text-[#5a63df] dark:text-indigo-400"
          >
            {item.source || 'Academic'}
          </Badge>
        </td>

        <MemoryMeterCell item={item} />

        <TableRowActionsCell
          item={item}
          onViewWord={onViewWord}
          onToggleMastery={onToggleMastery}
          onDeleteWord={onDeleteWord}
        />
      </tr>
    );
  }
);

VocabularyTableRow.displayName = 'VocabularyTableRow';
