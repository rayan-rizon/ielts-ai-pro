import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReviewSession({
  isOpen,
  onOpenChange,
  currentItem,
  isFlipped,
  onFlip,
  onSubmit,
}) {
  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} data-oid="kqxlp:o">
      <DialogContent
        className="max-w-2xl bg-transparent border-none shadow-none p-0 overflow-visible"
        data-oid="c27cbb6"
      >
        <DialogTitle className="sr-only" data-oid="bafy0im">
          Review Session
        </DialogTitle>
        <div className="w-full flex flex-col items-center" data-oid="9whii.p">
          <div className="w-full h-[500px] relative perspective-1000" data-oid="lp4uhhs">
            <AnimatePresence mode="wait" initial={false} data-oid=".:-nirl">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 flex flex-col items-center justify-center p-12 cursor-pointer group overflow-hidden"
                  onClick={onFlip}
                  data-oid="dwj4lje"
                >
                  {/* Decorative Background Glow */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"
                    data-oid="4tmaid5"
                  />

                  <div
                    className="flex-1 flex flex-col items-center justify-center space-y-10 relative z-10 w-full"
                    data-oid="kgi.kkd"
                  >
                    <div className="space-y-2 text-center" data-oid="bcmp-bn">
                      <span
                        className="inline-block bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm"
                        data-oid="11tdr36"
                      >
                        Recall Challenge
                      </span>
                      <p
                        className="text-[11px] text-slate-400 font-bold uppercase tracking-widest"
                        data-oid="x7ii92x"
                      >
                        Identify the concept
                      </p>
                    </div>

                    <h2
                      className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter text-center italic drop-shadow-sm"
                      data-oid="q9bkhwa"
                    >
                      {currentItem.word}
                    </h2>

                    {(currentItem.example || currentItem.example_sentence) && (
                      <div
                        className="max-w-md bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5 transform group-hover:scale-[1.02] transition-transform duration-500"
                        data-oid="esnr.ru"
                      >
                        <p
                          className="text-lg text-slate-500 dark:text-slate-400 font-serif italic text-center leading-relaxed"
                          data-oid="j5xyjt3"
                        >
                          "{currentItem.example || currentItem.example_sentence}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-auto text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 group-hover:text-blue-500 transition-colors relative z-10"
                    data-oid="z41hscm"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"
                      data-oid="bqyecry"
                    />
                    Tap to Reveal
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateY: -90, opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 flex flex-col items-center justify-between p-10 overflow-hidden"
                  data-oid="ml0lutu"
                >
                  {/* Luminous Accent */}
                  <div
                    className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"
                    data-oid=":ge:4i8"
                  />

                  {/* Header */}
                  <div
                    className="w-full flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6 relative z-10"
                    data-oid="-4z8h82"
                  >
                    <div className="flex flex-col" data-oid="r.y3m41">
                      <span
                        className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase"
                        data-oid="h3d-1hw"
                      >
                        Definition
                      </span>
                      <span
                        className="text-xl font-black text-slate-900 dark:text-white italic"
                        data-oid="hdue-k-"
                      >
                        {currentItem.word}
                      </span>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
                      data-oid="xpwzd9b"
                    >
                      <Brain className="w-5 h-5" data-oid="-:_h8g4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 flex flex-col items-center justify-center text-center p-6 relative z-10"
                    data-oid="8qwr52a"
                  >
                    <p
                      className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 leading-tight tracking-tight font-serif italic"
                      data-oid="b_i8n23"
                    >
                      {currentItem.definition}
                    </p>
                  </div>

                  {/* Evaluation Matrix */}
                  <div className="w-full relative z-10" data-oid="lp3i0k4">
                    <p
                      className="text-center text-slate-400 text-[10px] mb-5 font-black uppercase tracking-[0.2em]"
                      data-oid="72dr8wq"
                    >
                      How well did you know this?
                    </p>
                    <div className="grid grid-cols-4 gap-3" data-oid="1b4b7mc">
                      {[
                        { val: 1, icon: '😫', label: 'Forgot', color: 'red' },
                        { val: 3, icon: '😐', label: 'Hard', color: 'orange' },
                        { val: 4, icon: '🙂', label: 'Good', color: 'blue' },
                        { val: 5, icon: '🤩', label: 'Easy', color: 'emerald' },
                      ].map((item) => (
                        <Button
                          key={item.val}
                          variant="outline"
                          className={cn(
                            'flex flex-col h-auto py-5 rounded-2xl bg-white dark:bg-slate-950 border-slate-100 dark:border-white/10 group transition-all duration-300 hover:shadow-xl',
                            `hover:border-${item.color}-500/50 hover:bg-${item.color}-500/5`
                          )}
                          onClick={() => onSubmit(item.val)}
                          data-oid="ax.0-9z"
                        >
                          <span
                            className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-500"
                            data-oid="uob:-r:"
                          >
                            {item.icon}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-black uppercase tracking-widest',
                              `text-${item.color}-500`
                            )}
                            data-oid="phtj-37"
                          >
                            {item.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
