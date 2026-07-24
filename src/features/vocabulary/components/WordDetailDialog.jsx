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

const WordHeader = ({ viewingWord }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleAudio = (e) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPronunciation(viewingWord.word).finally(() => setIsPlayingAudio(false));
  };

  return (
    <div className="bg-[#635BFF] dark:bg-slate-900 px-6 pt-6 pb-5 pr-12 text-white relative group overflow-hidden">
      <div className="relative z-10 space-y-2.5 max-w-[92%]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
            {viewingWord.source || 'Academic'}
          </Badge>
          {(viewingWord.mastery_level || 0) >= 4 && (
            <Badge className="bg-emerald-400/25 text-emerald-100 border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-amber-300" /> Mastered
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-2xs">
            {viewingWord.word}
          </h2>
          <button
            onClick={handleAudio}
            className={`p-1.5 rounded-full bg-white/15 hover:bg-white/30 transition-all cursor-pointer ${isPlayingAudio ? 'text-amber-300 animate-pulse' : 'text-white'}`}
            title="Listen pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-indigo-100/90 font-mono">
          <span>{viewingWord.ipa || `/${viewingWord.word}/`}</span>
          <span className="font-sans font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded bg-white/15">
            {viewingWord.pos || 'Word'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[9px] text-white/80 font-black uppercase tracking-wider pt-0.5">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Reviewed:{' '}
            <span className="text-white">{viewingWord.times_reviewed || 0} times</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" /> Retention: <span className="text-white">88%</span>
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
      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Languages className="w-3.5 h-3.5 text-[#635BFF]" />
        Translate to
      </h3>
      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
        <SelectTrigger className="w-[130px] h-7.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-xs font-bold">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="font-medium text-xs">
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-1.5">
      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <div className="w-1.5 h-3 bg-[#635BFF] rounded-full" />
        Meaning / Definition
      </h3>
      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium border-l-2 border-[#635BFF] pl-3 py-0.5">
        {viewingWord.definition || 'Definition unavailable.'}
      </p>

      {targetLanguage !== 'en' && (
        <div className="mt-2 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/90 dark:border-indigo-900/40 space-y-1">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3 h-3 text-[#635BFF]" />
            <span className="text-[9px] font-black text-[#635BFF] dark:text-indigo-400 uppercase tracking-wider">
              {getLanguageName(targetLanguage)} Translation
            </span>
            {isTranslating && (
              <span className="text-[9px] text-slate-400 animate-pulse">Translating...</span>
            )}
          </div>
          {translatedWord && (
            <p className="text-xs font-black text-slate-900 dark:text-white">{translatedWord}</p>
          )}
          {translatedDefinition && (
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
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
      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
        Context Example
      </h3>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
          "{exampleText}"
        </p>
      </div>
    </div>
  );
};

const OperationalControls = ({ viewingWord, setViewingWord, handleDeleteWord }) => (
  <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
    <Button
      variant="ghost"
      className="h-8.5 px-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-black uppercase tracking-wider text-[10px] cursor-pointer"
      onClick={() => {
        handleDeleteWord(viewingWord.id);
        setViewingWord(null);
      }}
    >
      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Entry
    </Button>
    <Button
      type="button"
      className="bg-[#635BFF] hover:bg-[#5249E6] text-white h-8.5 px-5 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-2xs active:scale-95 transition-all cursor-pointer"
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
        className="max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-0 overflow-hidden rounded-2xl"
      >
        <DialogClose className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/15 hover:bg-black/25 text-white z-50 transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5" />
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
