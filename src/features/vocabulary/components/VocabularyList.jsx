import React, { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Search, ChevronRight, Languages } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  translateText,
  getCachedTranslation,
} from '@/features/vocabulary/services/translateService';

// Memoized row component with translation support
const VocabularyRow = memo(
  ({ item, onViewWord, onToggleMastery, onDeleteWord, targetLanguage }) => {
    const [translatedDef, setTranslatedDef] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
      const translateDefinition = async () => {
        if (!targetLanguage || targetLanguage === 'en') {
          setTranslatedDef('');
          return;
        }

        // Check cache first
        const cached = getCachedTranslation(item.definition || '', targetLanguage, 'en');
        if (cached) {
          setTranslatedDef(cached);
          return;
        }

        setIsTranslating(true);
        try {
          const translated = await translateText(item.definition || '', targetLanguage, 'en');
          setTranslatedDef(translated);
        } catch (error) {
          console.error('Translation failed:', error);
          setTranslatedDef('');
        } finally {
          setIsTranslating(false);
        }
      };

      translateDefinition();
    }, [item.definition, targetLanguage]);

    return (
      <tr
        className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300 group"
        data-oid="9mhjf87"
      >
        <td className="px-3 sm:px-6 py-3 sm:py-4" data-oid="jf05mjw">
          <div className="flex flex-col gap-1" data-oid="51xjtrw">
            <span
              className="text-base font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors tracking-tight italic"
              onClick={() => onViewWord(item)}
              data-oid="580p_1y"
            >
              {item.word}
            </span>
            <p
              className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-md font-medium leading-relaxed"
              data-oid="0c0yw7_"
            >
              {item.definition}
            </p>
            {targetLanguage && targetLanguage !== 'en' && (
              <div className="flex items-center gap-1.5 mt-0.5" data-oid="byb654z">
                <Languages className="w-3 h-3 text-indigo-500" data-oid="e7utjql" />
                {isTranslating ? (
                  <span
                    className="text-[10px] text-indigo-400 italic animate-pulse"
                    data-oid="ksbe:qw"
                  >
                    Translating...
                  </span>
                ) : translatedDef ? (
                  <span
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 italic line-clamp-1"
                    data-oid="jggli24"
                  >
                    {translatedDef}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4" data-oid="-iekr3a">
          <Badge
            variant="secondary"
            className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-none rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
            data-oid="gb:3jv8"
          >
            {item.source || 'Manual'}
          </Badge>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4" data-oid="hxw33y2">
          <div className="flex flex-col items-center gap-1.5" data-oid="ypaxaqz">
            <Badge
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm',
                (item.mastery_level || 0) >= 4
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              )}
              data-oid=":79l-5c"
            >
              {(item.mastery_level || 0) >= 4 ? 'Mastery' : 'Learning'}
            </Badge>
          </div>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right" data-oid="8:n9:9_">
          <div
            className="flex items-center justify-end gap-1.5 sm:gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity lg:translate-x-2 lg:group-hover:translate-x-0 transition-transform"
            data-oid="p-pqr9r"
          >
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-10 w-10 rounded-xl transition-all',
                (item.mastery_level || 0) >= 4
                  ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : 'text-slate-400 bg-slate-100 dark:bg-white/5 hover:text-emerald-500 hover:bg-emerald-500/10'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastery(item.id, item.mastery_level || 0);
              }}
              data-oid="7pgq2pp"
            >
              <Star
                className={cn('w-4 h-4', (item.mastery_level || 0) >= 4 ? 'fill-current' : '')}
                data-oid="zwqs87v"
              />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-slate-100 dark:bg-white/5"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWord(item.id);
              }}
              data-oid="1teuskg"
            >
              <Trash2 className="w-4 h-4" data-oid="yg2ufsg" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);

VocabularyRow.displayName = 'VocabularyRow';

export default function VocabularyList({
  filteredWords,
  hasMore,
  isLoadingMore,
  onViewWord,
  onToggleMastery,
  onDeleteWord,
  onLoadMore,
  targetLanguage,
}) {
  return (
    <div className="overflow-x-auto custom-scrollbar" data-oid="uwebtmh">
      <table className="w-full text-sm text-left border-collapse min-w-[800px]" data-oid="bi8:q2v">
        <thead
          className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-white/[0.12]"
          data-oid="pdrnzq4"
        >
          <tr data-oid="r20t9u:">
            <th className="px-3 sm:px-6 py-4 font-black" data-oid="t.a9mdw">
              Term / Definition
            </th>
            <th className="px-3 sm:px-6 py-4 font-black" data-oid=":tkwxm9">
              Origin
            </th>
            <th className="px-3 sm:px-6 py-4 font-black text-center" data-oid="1w5kdoo">
              Proficiency
            </th>
            <th className="px-3 sm:px-6 py-4 font-black text-right" data-oid="hxibv1n">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.12]" data-oid="6wnemc4">
          {filteredWords.map((item) => (
            <VocabularyRow
              key={item.id}
              item={item}
              onViewWord={onViewWord}
              onToggleMastery={onToggleMastery}
              onDeleteWord={onDeleteWord}
              targetLanguage={targetLanguage}
              data-oid="ag:9ka6"
            />
          ))}

          {filteredWords.length === 0 && (
            <tr data-oid="khqurf1">
              <td colSpan="4" className="px-8 py-20 text-center" data-oid="qf:.26s">
                <div className="flex flex-col items-center gap-4" data-oid="v4.9137">
                  <div
                    className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700"
                    data-oid="rgrb0ys"
                  >
                    <Search className="w-8 h-8" data-oid="b6b0mf2" />
                  </div>
                  <div className="space-y-1" data-oid="gqj6yoh">
                    <p
                      className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm"
                      data-oid="1-bfjvi"
                    >
                      No results found
                    </p>
                    <p
                      className="text-xs text-slate-500 font-medium tracking-tight"
                      data-oid="5-3ojp_"
                    >
                      Expand your filters or add new words.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {hasMore && (
        <div
          className="p-6 border-t border-slate-100 dark:border-white/[0.12] text-center bg-slate-50/30 dark:bg-white-[0.02]"
          data-oid="hojb3im"
        >
          <Button
            variant="ghost"
            className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px] hover:bg-blue-500/5"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            data-oid="h96nl:h"
          >
            {isLoadingMore ? (
              <>Loading...</>
            ) : (
              <>
                Load More <ChevronRight className="w-3 h-3 ml-2" data-oid="dl5jta9" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
