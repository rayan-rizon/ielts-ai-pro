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
import { X, Star, Clock, Languages, Trash2, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  getLanguageName,
} from '@/features/vocabulary/services/translateService';
import { AI_DEFINE_LANGUAGES } from '@/features/vocabulary/services/vocabDefineService';
import { getItemTranslation, needsEnrichment } from '../utils/vocabCard';
import { playPronunciation } from '../utils/audioUtils';
import { getPartOfSpeech } from './vocabularyUtils';
import { WordCardBody, WordMetaRow } from './WordCardBody';

const WordHeader = ({ viewingWord }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const pos = getPartOfSpeech(viewingWord);

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
            aria-label="Listen to pronunciation"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-indigo-100/90">
          {viewingWord.ipa && <span className="font-sans text-xs">{viewingWord.ipa}</span>}
          <span className="rounded bg-white/15 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider">
            {pos}
          </span>
          {viewingWord.level && (
            <span className="rounded bg-white/15 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider">
              {viewingWord.level}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 pt-0.5 text-[9px] font-black uppercase tracking-wider text-white/80">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Reviewed:{' '}
            <span className="text-white">{viewingWord.times_reviewed || 0} times</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LanguageRow = ({ targetLanguage, setTargetLanguage }) => (
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
);

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

const uniqueExamples = (item) => {
  const seen = new Set();
  return [item.example || item.example_sentence, ...(item.details?.examples || [])]
    .map((text) => String(text || '').trim())
    .filter((text) => {
      const key = text.toLowerCase();
      if (!text || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export default function WordDetailDialog({
  viewingWord,
  setViewingWord,
  targetLanguage,
  setTargetLanguage,
  handleDeleteWord,
  onEnrich,
  isEnriching = false,
  enrichNotice = null,
}) {
  const languageName = getLanguageName(targetLanguage);

  // Opening a word that never got its card asks for it once; the server decides
  // whether that is allowed, and a refusal is shown instead of retried.
  useEffect(() => {
    if (viewingWord && onEnrich && needsEnrichment(viewingWord, targetLanguage)) {
      onEnrich(viewingWord);
    }
  }, [viewingWord, targetLanguage, onEnrich]);

  const stored = viewingWord ? getItemTranslation(viewingWord, targetLanguage) : null;
  let translation = null;
  let translationState = 'idle';
  if (viewingWord && targetLanguage !== 'en') {
    if (stored) {
      translation = {
        label: `${languageName} meaning`,
        lang: targetLanguage,
        word: stored.word,
        meaning: stored.meaning,
      };
    } else if (isEnriching) {
      translationState = 'loading';
    }
  }

  const showRetry =
    Boolean(viewingWord) &&
    !isEnriching &&
    AI_DEFINE_LANGUAGES.has(targetLanguage) &&
    !stored &&
    Boolean(onEnrich);

  return (
    <Dialog open={!!viewingWord} onOpenChange={(open) => !open && setViewingWord(null)}>
      <DialogContent
        hideClose
        className="max-h-[92vh] max-w-md overflow-y-auto rounded-xl border border-[#e2e5f2] bg-white p-0 dark:border-white/10 dark:bg-[#131315]"
      >
        <DialogClose className="absolute right-3.5 top-3.5 z-50 rounded-full bg-black/15 p-1.5 text-white transition-colors hover:bg-black/25">
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close</span>
        </DialogClose>
        {viewingWord && (
          <div className="flex flex-col">
            <WordHeader viewingWord={viewingWord} />
            <div className="space-y-4 p-5">
              <LanguageRow targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage} />

              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <div className="h-3 w-1.5 rounded-full bg-[#5a63df]" />
                  Meaning
                </h3>
                <WordMetaRow register={viewingWord.details?.register} />
                <WordCardBody
                  meaning={viewingWord.definition || 'Definition unavailable.'}
                  translation={translation}
                  translationState={translationState}
                  translationLabel={languageName}
                  examples={uniqueExamples(viewingWord)}
                  synonyms={viewingWord.synonyms || []}
                  collocations={viewingWord.details?.collocations || []}
                  wordFamily={viewingWord.details?.wordFamily || []}
                  commonMistake={viewingWord.details?.commonMistake || ''}
                />
              </div>

              {enrichNotice && (
                <p
                  role="status"
                  className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>{enrichNotice.message}</span>
                </p>
              )}
              {showRetry && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8.5 w-full rounded-lg border-[#e2e5f2] text-[10px] font-black uppercase tracking-wider text-[#5a63df] dark:border-white/10"
                  onClick={() => onEnrich(viewingWord, { force: true })}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Add {languageName} meaning
                </Button>
              )}

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
