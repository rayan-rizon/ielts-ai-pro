import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { m } from 'framer-motion';
import { AlertCircle, Check, BookOpen } from 'lucide-react';

export default function WordDefinitionPopover({ wordDefinition, addToVocabulary }) {
  if (!wordDefinition || !wordDefinition.position) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'absolute',
          top: `${wordDefinition.position.y + 12}px`,
          left: Math.min(
            window.innerWidth - 320,
            Math.max(20, Math.min(wordDefinition.position.x - 140, wordDefinition.position.x))
          ),
          zIndex: 200,
        }}
      >
        <div className="w-72 bg-white dark:bg-slate-900 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[1.75rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] p-4 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex justify-between items-start mb-2">
            <h5 className="text-base font-black text-slate-900 dark:text-white truncate pr-4">
              {wordDefinition.word}
            </h5>
          </div>

          {wordDefinition.vocabError || wordDefinition.error ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
                {wordDefinition.error
                  ? 'Definition not found.'
                  : wordDefinition.errorMessage || 'Could not add to vocabulary.'}
              </p>
              {wordDefinition.definition &&
                wordDefinition.definition !== 'Definition not found.' && (
                  <div className="text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                    {wordDefinition.definition}
                  </div>
                )}
            </div>
          ) : wordDefinition.addedToVocab ? (
            <div className="text-center py-4 space-y-2 animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400 shadow-lg">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-bold text-base text-slate-800 dark:text-white">
                Added to Word Bank!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">+5 points earned</p>
            </div>
          ) : wordDefinition.alreadyExists ? (
            <div className="text-center py-4 space-y-2 animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="font-bold text-base text-slate-800 dark:text-white">
                Already in Word Bank
              </p>
            </div>
          ) : wordDefinition.definition === 'Loading...' ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="relative">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-6 h-6 border-3 border-blue-200 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
              </div>
              <span className="text-sm text-slate-500 animate-pulse font-medium">
                Looking up definition...
              </span>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-3">
                {wordDefinition.definition}
              </div>
              {wordDefinition.example && (
                <div className="mt-3 relative pl-4 border-l-2 border-blue-200 dark:border-blue-700/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20 dark:to-transparent py-2 pr-2 rounded-r-lg">
                  <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed font-serif">
                    "{wordDefinition.example}"
                  </p>
                </div>
              )}
              {wordDefinition.synonyms && wordDefinition.synonyms.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    Synonyms
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {wordDefinition.synonyms.slice(0, 5).map((syn, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-default shadow-sm"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!wordDefinition.addedToVocab &&
            !wordDefinition.alreadyExists &&
            !wordDefinition.error &&
            !wordDefinition.vocabError && (
              <button
                onClick={() => addToVocabulary(wordDefinition)}
                disabled={wordDefinition.definition === 'Loading...'}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-500 text-white hover:from-slate-800 hover:to-slate-700 dark:hover:from-blue-500 dark:hover:to-blue-400 active:scale-[0.98] transition-all text-sm font-bold shadow-xl shadow-slate-200/50 dark:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Add to Word Bank
              </button>
            )}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
