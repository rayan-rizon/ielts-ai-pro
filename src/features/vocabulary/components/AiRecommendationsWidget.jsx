import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Volume2, Check, ArrowRight, BrainCircuit, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { playPronunciation } from '../utils/audioUtils';

const RECOMMENDATIONS = [
  {
    id: 'rec-1',
    word: 'aberration',
    ipa: '/ˌæb.əˈreɪ.ʃən/',
    pos: 'n.',
    definition: 'A departure from what is normal, expected, or desired.',
    impact: 'Band 8.5+',
    impactColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    category: 'Academic Writing',
  },
  {
    id: 'rec-2',
    word: 'nuanced',
    ipa: '/ˈnjuː.ɑːnst/',
    pos: 'adj.',
    definition: 'Showing subtle differences in meaning, expression, or sound.',
    impact: 'High Utility',
    impactColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    category: 'Task 2 Essay',
  },
  {
    id: 'rec-3',
    word: 'ephemeral',
    ipa: '/ɪˈfem.ər.əl/',
    pos: 'adj.',
    definition: 'Lasting for a very short time; fleeting.',
    impact: 'Band 8.0+',
    impactColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    category: 'Speaking Booster',
  },
];

const WEAK_AREAS = [
  { name: 'Abstract Nouns', score: 62, color: 'bg-rose-500' },
  { name: 'Academic Writing Task 2', score: 58, color: 'bg-amber-500' },
  { name: 'Collocations & Idioms', score: 48, color: 'bg-indigo-500' },
];

export default function AiRecommendationsWidget({ onAddWord, allVocabulary = [], onStartQuiz }) {
  const [addedMap, setAddedMap] = useState({});
  const [playingWord, setPlayingWord] = useState(null);

  const handleAdd = async (rec) => {
    setAddedMap((prev) => ({ ...prev, [rec.id]: 'loading' }));
    try {
      const res = await onAddWord({
        word: rec.word,
        definition: rec.definition,
        example: `The study observed a slight aberration in the expected data trends.`,
      });
      if (res?.success || res) {
        setAddedMap((prev) => ({ ...prev, [rec.id]: true }));
      } else {
        setAddedMap((prev) => ({ ...prev, [rec.id]: false }));
      }
    } catch {
      setAddedMap((prev) => ({ ...prev, [rec.id]: false }));
    }
  };

  const isWordInBank = (wordStr) => {
    return allVocabulary.some((item) => item?.word?.toLowerCase() === wordStr.toLowerCase());
  };

  const handleSpeak = (e, word) => {
    e.stopPropagation();
    setPlayingWord(word);
    playPronunciation(word).finally(() => setPlayingWord(null));
  };

  return (
    <Card className="w-full border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-white/[0.12] overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2.5 text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          AI Recommendations
        </CardTitle>
        <Badge
          variant="outline"
          className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5"
        >
          Beta
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Recommended Words */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
            Targeted Picks for Band 8.0+
          </p>

          <div className="space-y-2.5">
            {RECOMMENDATIONS.map((rec) => {
              const alreadyAdded = isWordInBank(rec.word) || addedMap[rec.id] === true;
              const isLoading = addedMap[rec.id] === 'loading';

              return (
                <motion.div
                  key={rec.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white italic tracking-tight">
                        {rec.word}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {rec.pos}
                      </span>
                      <button
                        onClick={(e) => handleSpeak(e, rec.word)}
                        className={cn(
                          'p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-400 hover:text-purple-600 transition-colors',
                          playingWord === rec.word && 'text-purple-600 animate-pulse'
                        )}
                        title="Listen pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <Badge
                        className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-2 py-0 border',
                          rec.impactColor
                        )}
                      >
                        {rec.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                      {rec.definition}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={alreadyAdded ? 'ghost' : 'outline'}
                    disabled={alreadyAdded || isLoading}
                    onClick={() => handleAdd(rec)}
                    className={cn(
                      'h-8 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex-shrink-0',
                      alreadyAdded
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-none'
                        : 'border-slate-200 dark:border-white/10 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                    )}
                  >
                    {alreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Saved
                      </>
                    ) : isLoading ? (
                      '...'
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weak Areas Breakdown */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-500" />
              Focus Areas (Band Boost)
            </span>
          </div>

          <div className="space-y-2.5">
            {WEAK_AREAS.map((wa, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{wa.name}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {wa.score}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', wa.color)}
                    style={{ width: `${wa.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {onStartQuiz && (
          <Button
            onClick={onStartQuiz}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Start AI Practice Quiz <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
