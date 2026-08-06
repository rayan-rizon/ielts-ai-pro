import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Star, Clock, Brain, Languages, Trash2, Volume2 } from 'lucide-react';
import {
  translateText,
  SUPPORTED_LANGUAGES,
  getLanguageName,
} from '@/features/vocabulary/services/translateService';
import { playPronunciation } from '../utils/audioUtils';
import { TILE } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

const WordHeader = ({ viewingWord }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleAudio = (e) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPronunciation(viewingWord.word).finally(() => setIsPlayingAudio(false));
  };

  return (
    <div className="group relative overflow-hidden bg-[#5a63df] px-6 pb-5 pr-12 pt-6 text-white dark:bg-[#131315]">
      <div className="relative z-10 max-w-[92%] space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-md border-none bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white hover:bg-white/30">
            {viewingWord.source || 'Academic'}
          </Badge>
          {(viewingWord.mastery_level || 0) >= 4 && (
            <Badge className="flex items-center gap-1 rounded-md border-none bg-emerald-400/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-100">
              <Star className="h-3 w-3 fill-current text-amber-300" /> Mastered
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{viewingWord.word}</h2>
          <button
            onClick={handleAudio}
            className={`cursor-pointer rounded-full bg-white/15 p-1.5 transition-all hover:bg-white/30 ${isPlayingAudio ? 'animate-pulse text-amber-300' : 'text-white'}`}
            title="Listen pronunciation"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs text-indigo-100/90">
          <span>{viewingWord.ipa || `/${viewingWord.word}/`}</span>
          <span className="rounded bg-white/15 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider">
            {viewingWord.pos || 'Word'}
          </span>
        </div>

        <div className="flex items-center gap-4 pt-0.5 text-[9px] font-black uppercase tracking-wider text-white/80">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Reviewed:{' '}
            <span className="text-white">{viewingWord.times_reviewed || 0} times</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="h-3 w-3" /> Retention: <span className="text-white">88%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslationSection = ({
  viewingWord,
  targetLanguage,
  setTargetLanguage,
  translatedWord,
  translatedDefinition,
  isTranslating,
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <Languages className="h-3.5 w-3.5 text-[#5a63df]" />
        Translate to
      </h3>
      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
        <SelectTrigger className="h-7.5 w-[130px] rounded-lg border-[#e2e5f2] bg-[#fbfbfe] text-xs font-bold dark:border-white/10 dark:bg-white/4">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-xs font-medium">
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <div className="h-3 w-1.5 rounded-full bg-[#5a63df]" />
        Meaning / Definition
      </h3>
      <p className="border-l-2 border-[#5a63df] py-0.5 pl-3 text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-sm">
        {viewingWord.definition || 'Definition unavailable.'}
      </p>

      {targetLanguage !== 'en' && (
        <div className="mt-2 space-y-1 rounded-lg border border-[#e2e5f2] bg-[#5a63df]/6 p-3 dark:border-white/10 dark:bg-indigo-950/40">
          <div className="flex items-center gap-1.5">
            <Languages className="h-3 w-3 text-[#5a63df]" />
            <span className="text-[9px] font-black uppercase tracking-wider text-[#5a63df] dark:text-indigo-400">
              {getLanguageName(targetLanguage)} Translation
            </span>
            {isTranslating && (
              <span className="animate-pulse text-[9px] text-slate-400">Translating...</span>
            )}
          </div>
          {translatedWord && (
            <p className="text-xs font-black text-slate-900 dark:text-white">{translatedWord}</p>
          )}
          {translatedDefinition && (
            <p className="text-xs italic text-slate-600 dark:text-slate-300">
              {translatedDefinition}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
);

const ExampleSection = ({ viewingWord }) => {
  const exampleText = viewingWord.example || viewingWord.example_sentence;
  if (!exampleText) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <div className="h-3 w-1.5 rounded-full bg-amber-500" />
        Context Example
      </h3>
      <div className={cn(TILE, 'p-3')}>
        <p className="text-xs italic leading-relaxed text-slate-700 dark:text-slate-300">
          &quot;{exampleText}&quot;
        </p>
      </div>
    </div>
  );
};

const OperationalControls = ({ viewingWord, setViewingWord, handleDeleteWord }) => (
  <div className="flex items-center justify-between border-t border-[#eeedf7] pt-3 dark:border-white/10">
    <Button
      variant="ghost"
      className="h-8.5 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider text-[rgb(var(--signal-fault))] hover:bg-[rgba(var(--signal-fault),0.08)]"
      onClick={() => {
        handleDeleteWord(viewingWord.id);
        setViewingWord(null);
      }}
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Entry
    </Button>
    <Button
      type="button"
      className="h-8.5 rounded-lg bg-[#5a63df] px-5 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-[#4a52c9] active:scale-95"
      onClick={() => setViewingWord(null)}
    >
      Close
    </Button>
  </div>
);

export default function WordDetailDialog({
  viewingWord,
  setViewingWord,
  targetLanguage,
  setTargetLanguage,
  handleDeleteWord,
}) {
  const [translatedWord, setTranslatedWord] = useState('');
  const [translatedDefinition, setTranslatedDefinition] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateCurrentWord = async () => {
      if (!viewingWord || targetLanguage === 'en') {
        setTranslatedWord('');
        setTranslatedDefinition('');
        return;
      }

      setIsTranslating(true);
      try {
        const [wordTrans, defTrans] = await Promise.all([
          translateText(viewingWord.word, targetLanguage, 'en'),
          translateText(viewingWord.definition || '', targetLanguage, 'en'),
        ]);
        setTranslatedWord(wordTrans);
        setTranslatedDefinition(defTrans);
      } catch (error) {
        console.error('Translation failed:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    translateCurrentWord();
  }, [viewingWord, targetLanguage]);

  return (
    <Dialog open={!!viewingWord} onOpenChange={(open) => !open && setViewingWord(null)}>
      <DialogContent
        hideClose
        className="max-w-md overflow-hidden rounded-xl border border-[#e2e5f2] bg-white p-0 dark:border-white/10 dark:bg-[#131315]"
      >
        <DialogClose className="absolute right-3.5 top-3.5 z-50 rounded-full bg-black/15 p-1.5 text-white transition-colors hover:bg-black/25">
          <X className="h-3.5 w-3.5" />
        </DialogClose>
        {viewingWord && (
          <div className="flex flex-col">
            <WordHeader viewingWord={viewingWord} />
            <div className="p-5 space-y-4">
              <TranslationSection
                viewingWord={viewingWord}
                targetLanguage={targetLanguage}
                setTargetLanguage={setTargetLanguage}
                translatedWord={translatedWord}
                translatedDefinition={translatedDefinition}
                isTranslating={isTranslating}
              />
              <ExampleSection viewingWord={viewingWord} />
              <OperationalControls
                viewingWord={viewingWord}
                setViewingWord={setViewingWord}
                handleDeleteWord={handleDeleteWord}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
