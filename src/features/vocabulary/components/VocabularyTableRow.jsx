import React, { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Languages, Volume2, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  translateText,
  getCachedTranslation,
} from '@/features/vocabulary/services/translateService';
import { playPronunciation } from '../utils/audioUtils';
import { getPartOfSpeech, getMemoryStrength } from './vocabularyUtils';

const useWordTranslation = (definition, targetLanguage) => {
  const [translatedDef, setTranslatedDef] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!targetLanguage || targetLanguage === 'en') {
      setTranslatedDef('');
      return;
    }

    const cached = getCachedTranslation(definition || '', targetLanguage, 'en');
    if (cached) {
      setTranslatedDef(cached);
      return;
    }

    setIsTranslating(true);
    translateText(definition || '', targetLanguage, 'en')
      .then((translated) => setTranslatedDef(translated))
      .catch(() => setTranslatedDef(''))
      .finally(() => setIsTranslating(false));
  }, [definition, targetLanguage]);

  return { translatedDef, isTranslating };
};

const DefinitionCell = ({ definition, targetLanguage }) => {
  const { translatedDef, isTranslating } = useWordTranslation(definition, targetLanguage);
  const showTranslation = targetLanguage && targetLanguage !== 'en';

  return (
    <td className="px-4 py-3.5">
      <div className="space-y-1 max-w-lg">
        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {definition}
        </p>
        {showTranslation && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Languages className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            {isTranslating ? (
              <span className="text-xs text-indigo-400 italic animate-pulse">Translating...</span>
            ) : translatedDef ? (
              <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md line-clamp-1">
                {translatedDef}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </td>
  );
};

const MemoryMeterCell = ({ masteryLevel }) => {
  const memory = getMemoryStrength(masteryLevel);
  return (
    <td className="px-3 py-3.5">
      <div className="flex flex-col items-center gap-1 w-24 mx-auto">
        <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-700 dark:text-slate-300">
          <span>{memory.label}</span>
          <span>{memory.percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', memory.color)}
            style={{ width: `${memory.percent}%` }}
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
            'h-8 w-8 rounded-lg transition-all',
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
          className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-600"
          onClick={() => onViewWord(item)}
          title="View Detail"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500"
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
      <tr className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors border-b border-slate-200/60 dark:border-slate-800">
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSpeak}
              className={cn(
                'p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex-shrink-0',
                isPlayingAudio && 'text-indigo-600 animate-pulse bg-indigo-50'
              )}
              title="Listen audio pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-black text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm sm:text-base italic"
                onClick={() => onViewWord(item)}
              >
                {item.word}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {item.ipa || `/${item.word}/`}
              </span>
            </div>
          </div>
        </td>

        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold"
          >
            {pos}
          </Badge>
        </td>

        <DefinitionCell definition={item.definition} targetLanguage={targetLanguage} />

        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-xs font-bold px-2.5 py-0.5"
          >
            {item.source || 'Academic'}
          </Badge>
        </td>

        <MemoryMeterCell masteryLevel={item.mastery_level || 0} />

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
