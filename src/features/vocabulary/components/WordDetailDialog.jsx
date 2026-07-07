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
import { X, BookOpen, Star, Clock, Brain, Languages, Zap, Trash2 } from 'lucide-react';
import {
  translateText,
  SUPPORTED_LANGUAGES,
  getLanguageName,
} from '@/features/vocabulary/services/translateService';

// Subcomponents to reduce cyclomatic complexity
const WordHeader = ({ viewingWord }) => (
  <div
    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-8 pb-8 pt-14 pr-16 text-white relative group overflow-hidden"
    data-oid="g5_6781"
  >
    <div
      className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
      data-oid="17yfw:k"
    ></div>
    <div
      className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000"
      data-oid=".-3y.tf"
    >
      <BookOpen className="w-32 h-32" data-oid="hybtvfg" />
    </div>

    <div className="relative z-10 space-y-3 max-w-[85%]" data-oid="cu4_dnd">
      <div className="flex flex-wrap items-center gap-2" data-oid="5gv7t6f">
        <Badge
          className="bg-white/20 hover:bg-white/30 text-white border-white/10 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm"
          data-oid="b3pleh8"
        >
          {viewingWord.source || 'Manual Record'}
        </Badge>
        {(viewingWord.mastery_level || 0) >= 4 && (
          <Badge
            className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm"
            data-oid="rp0rp4d"
          >
            <Star className="w-3 h-3 fill-current" data-oid="g-yso:x" /> Mastery Reached
          </Badge>
        )}
      </div>
      <h2 className="text-4xl font-black tracking-tighter drop-shadow-lg" data-oid="r22zj8:">
        {viewingWord.word}
      </h2>
      <div
        className="flex items-center gap-6 text-[10px] text-white/70 font-black uppercase tracking-widest pt-2"
        data-oid="bu72mu7"
      >
        <div className="flex items-center gap-2" data-oid="vmqlf8t">
          <Clock className="w-3.5 h-3.5" data-oid="fwrhin:" /> Reviewed:{' '}
          <span className="text-white" data-oid="hf6b89i">
            {viewingWord.times_reviewed || 0}
          </span>
        </div>
        <div className="flex items-center gap-2" data-oid="wn9xbds">
          <Brain className="w-3.5 h-3.5" data-oid="i5e:ckg" /> Retention:{' '}
          <span className="text-white" data-oid="5p:vn7g">
            88%
          </span>
        </div>
      </div>
    </div>
  </div>
);

const TranslationSection = ({
  viewingWord,
  targetLanguage,
  setTargetLanguage,
  translatedWord,
  translatedDefinition,
  isTranslating,
}) => (
  <>
    {/* Language Selector */}
    <div className="flex items-center justify-between" data-oid="e-hn8l0">
      <h3
        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
        data-oid="f6a9bo2"
      >
        <Languages className="w-4 h-4" data-oid="yfc6vb9" />
        Translate to
      </h3>
      <Select value={targetLanguage} onValueChange={setTargetLanguage} data-oid="yf27:l.">
        <SelectTrigger
          className="w-[160px] h-9 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm font-bold"
          data-oid="qx1qi5b"
        >
          <SelectValue placeholder="Select language" data-oid="0lghnaa" />
        </SelectTrigger>
        <SelectContent className="rounded-xl" data-oid="-5ul3ar">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="font-medium"
              data-oid="ddqr1-p"
            >
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Definition Section */}
    <div className="space-y-3" data-oid="khy24rs">
      <h3
        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
        data-oid="dxt33y5"
      >
        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" data-oid="vb.t8cj" />
        Definition
      </h3>
      <p
        className="text-xl text-slate-800 dark:text-slate-200 leading-snug font-serif italic border-l-4 border-indigo-500/20 pl-5 py-1"
        data-oid="rf7dm40"
      >
        {viewingWord.definition || 'Definition unavailable.'}
      </p>

      {/* Translation Display */}
      {targetLanguage !== 'en' && (
        <div
          className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/30"
          data-oid="q7llcyv"
        >
          <div className="flex items-center gap-2 mb-2" data-oid="s20e-g1">
            <Languages className="w-3.5 h-3.5 text-indigo-500" data-oid=".3.0p_m" />
            <span
              className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
              data-oid="i9--.t6"
            >
              {getLanguageName(targetLanguage)} Translation
            </span>
            {isTranslating && (
              <span className="text-[9px] text-slate-400 animate-pulse" data-oid="ao04sru">
                Translating...
              </span>
            )}
          </div>
          {translatedWord && (
            <p
              className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-1"
              data-oid="yanawqo"
            >
              {translatedWord}
            </p>
          )}
          {translatedDefinition && (
            <p className="text-base text-slate-700 dark:text-slate-300 italic" data-oid="3c_9s90">
              {translatedDefinition}
            </p>
          )}
          {!isTranslating && !translatedWord && !translatedDefinition && (
            <p className="text-sm text-slate-500 italic" data-oid="ttgvuv7">
              Translation unavailable
            </p>
          )}
        </div>
      )}
    </div>
  </>
);

const ExampleSection = ({ viewingWord }) => {
  if (!viewingWord.example && !viewingWord.example_sentence) return null;

  return (
    <div className="space-y-4" data-oid="jyvsw0v">
      <h3
        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
        data-oid="i41nev."
      >
        <div className="w-1.5 h-4 bg-amber-500 rounded-full" data-oid="-d4zblp" />
        Example
      </h3>
      <div
        className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group/context"
        data-oid=":h.5sej"
      >
        <div
          className="absolute top-0 right-0 p-4 opacity-5 group-hover/context:scale-110 transition-transform"
          data-oid="qiygw_o"
        >
          <Zap className="w-12 h-12" data-oid="fb773-2" />
        </div>
        <p
          className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed italic font-serif relative z-10"
          data-oid="in1n94h"
        >
          "{viewingWord.example || viewingWord.example_sentence}"
        </p>
      </div>
    </div>
  );
};

const OperationalControls = ({ viewingWord, setViewingWord, handleDeleteWord }) => (
  <div
    className="pt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5"
    data-oid="hyg27po"
  >
    <Button
      variant="ghost"
      className="h-12 px-6 rounded-xl text-red-500 hover:bg-red-500/5 font-black uppercase tracking-widest text-[9px] group transition-all"
      onClick={() => {
        handleDeleteWord(viewingWord.id);
        setViewingWord(null);
      }}
      data-oid="r01932v"
    >
      <Trash2 className="w-4 h-4 mr-3 group-hover:animate-bounce" data-oid=":9wqekp" /> Purge Entry
    </Button>
    <Button
      type="button"
      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-10 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
      onClick={(e) => {
        e.preventDefault();
        setViewingWord(null);
      }}
      data-oid="rv0h_zf"
    >
      Acknowledge
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
        setTranslatedWord('');
        setTranslatedDefinition('');
      } finally {
        setIsTranslating(false);
      }
    };

    translateCurrentWord();
  }, [viewingWord, targetLanguage]);

  return (
    <Dialog
      open={!!viewingWord}
      onOpenChange={(open) => !open && setViewingWord(null)}
      data-oid=".dg5vna"
    >
      <DialogContent
        hideClose
        className="max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-none shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-0 overflow-hidden rounded-3xl"
        data-oid="t8t277p"
      >
        <DialogClose
          className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-all text-white/80 hover:text-white backdrop-blur-md z-[60] ring-1 ring-white/20"
          data-oid="300yw7t"
        >
          <X className="w-5 h-5" data-oid="ajvd.uo" />
          <span className="sr-only" data-oid="d3jqqib">
            Close
          </span>
        </DialogClose>
        {viewingWord && (
          <div className="flex flex-col italic" data-oid="fl2_w67">
            <WordHeader viewingWord={viewingWord} />
            <div className="p-8 space-y-6" data-oid="wof-yw3">
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
