import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Speed Quiz Modal
export function SpeedQuizModal({ isOpen, onClose, gameData, gameState, gameScore, onAnswer }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-oid=".es5un_">
      <DialogContent
        hideClose
        className="max-w-2xl bg-white dark:bg-slate-950 border-none shadow-2xl p-0 overflow-hidden rounded-3xl"
        data-oid="hfq9o5y"
      >
        <div
          className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center relative"
          data-oid="s48o4:o"
        >
          <DialogTitle
            className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"
            data-oid="xxr7qrz"
          >
            <div
              className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20"
              data-oid="e17bkbf"
            >
              <Clock className="w-4 h-4" data-oid="cgdasla" />
            </div>
            Speed Match
          </DialogTitle>
          <div className="flex items-center gap-4" data-oid="18:yy2d">
            {gameState === 'playing' && gameData && (
              <div className="flex flex-col items-end mr-4" data-oid="-7gky0l">
                <span
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  data-oid="9rmjll_"
                >
                  Score
                </span>
                <span className="text-lg font-black text-white" data-oid="o9tzeco">
                  {gameScore}
                </span>
              </div>
            )}
            <DialogClose
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white hover:rotate-90"
              data-oid="y9yth4e"
            >
              <X className="w-4 h-4" data-oid="qlj1.8m" />
            </DialogClose>
          </div>
        </div>

        {gameData && gameData.questions && (
          <div className="p-6" data-oid="josb-1k">
            {gameState === 'playing' ? (
              <div className="space-y-6" data-oid=":v-xfhh">
                <div
                  className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden"
                  data-oid="gu5-jcy"
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${(((gameData.currentIndex || 0) + 1) / (gameData.questions?.length || 1)) * 100}%`,
                    }}
                    className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    data-oid="nlb198y"
                  />
                </div>

                <div className="space-y-2 text-center py-2" data-oid="89qo6gu">
                  <span
                    className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2"
                    data-oid="vham2ue"
                  >
                    What does this word mean?
                  </span>
                  <h3
                    className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none px-4"
                    data-oid="-8_ec.8"
                  >
                    {gameData.questions[gameData.currentIndex || 0]?.word || 'Unknown Word'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3" data-oid="e-v7q8z">
                  {(gameData.questions[gameData.currentIndex || 0]?.options || []).map(
                    (option, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="h-auto w-full p-4 py-3 text-left justify-start bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 group transition-all active:scale-[0.99]"
                        onClick={() => onAnswer(option)}
                        data-oid="ak:jz8h"
                      >
                        <div className="flex items-center gap-3 w-full" data-oid="1k90xl3">
                          <div
                            className="w-7 h-7 shrink-0 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400 transition-all"
                            data-oid="wc-ed9f"
                          >
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span
                            className="font-bold text-slate-700 dark:text-slate-200 text-sm leading-snug flex-1 italic group-hover:text-blue-600 dark:group-hover:text-blue-400 break-words whitespace-normal text-wrap"
                            data-oid="5fadhij"
                          >
                            {option}
                          </span>
                        </div>
                      </Button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 py-10" data-oid="nftxa:u">
                <div className="relative w-32 h-32 mx-auto" data-oid="f-441cd">
                  <div
                    className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"
                    data-oid="b2t4mte"
                  />

                  <div
                    className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-12"
                    data-oid="1leljk_"
                  >
                    <Trophy className="w-16 h-16 text-white drop-shadow-lg" data-oid="hlwd_z1" />
                  </div>
                </div>
                <div className="space-y-2" data-oid="2g216lb">
                  <h2
                    className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
                    data-oid=":3g750d"
                  >
                    Quiz Complete!
                  </h2>
                  <p
                    className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest"
                    data-oid=":yi1v38"
                  >
                    You earned:{' '}
                    <span className="text-emerald-500" data-oid="ykfe7qd">
                      +{gameScore} pts
                    </span>
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
                  data-oid="4-_84-g"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Match Pairs Modal
export function MatchPairsModal({
  isOpen,
  onClose,
  gameData,
  gameState,
  gameScore,
  onCardClick,
  onRestart,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-oid="-ymt5zk">
      <DialogContent
        hideClose
        className="max-w-4xl bg-[#fcfcfd] dark:bg-[#0c0c0e] border-none shadow-none p-0 overflow-hidden rounded-3xl"
        data-oid="dn0ifna"
      >
        <div
          className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl border-b border-slate-100 dark:border-white/5 p-4 px-6 flex justify-between items-center relative z-10"
          data-oid="uglk:9f"
        >
          <DialogTitle
            className="text-sm font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight"
            data-oid="bu-zu4c"
          >
            <div
              className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30"
              data-oid="sv7p.og"
            >
              <Target className="w-4 h-4" data-oid="0z9qm5_" />
            </div>
            Match Pairs
          </DialogTitle>
          {gameData && (
            <div className="flex items-center gap-4" data-oid="zk10qca">
              <div className="flex flex-col items-end mr-4" data-oid="2qrw804">
                <span
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  data-oid="oaqw:lt"
                >
                  Matched
                </span>
                <span
                  className="text-sm font-black text-slate-900 dark:text-white"
                  data-oid="p-_g:m0"
                >
                  {gameData.matchedPairs || 0}{' '}
                  <span className="text-[10px] text-slate-400" data-oid=":4j0..b">
                    / {gameData.totalPairs || 0}
                  </span>
                </span>
              </div>
              <div
                className="bg-indigo-500 dark:bg-indigo-600 px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 text-white"
                data-oid="o-opw:x"
              >
                <span
                  className="text-[9px] font-black uppercase tracking-widest mr-2 opacity-70"
                  data-oid="p1h_bn4"
                >
                  Score
                </span>
                <span className="text-sm font-black" data-oid="pg03qf2">
                  {gameScore}
                </span>
              </div>
              <DialogClose
                className="p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all text-slate-500 dark:text-white hover:rotate-90"
                data-oid="y6ifevp"
              >
                <X className="w-4 h-4" data-oid="6wqqbfs" />
              </DialogClose>
            </div>
          )}
        </div>

        {gameData && gameData.cards ? (
          <div
            className="p-6 min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-transparent relative"
            data-oid="_bycfnj"
          >
            {/* Background Accents */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"
              data-oid="ustzr8j"
            />

            {gameState === 'playing' ? (
              <div className="w-full relative z-10" data-oid="7h1vr76">
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                  layout
                  data-oid="yujs1lx"
                >
                  <AnimatePresence data-oid="kcqj5ca">
                    {gameData.cards.map((card) => {
                      const isFlipped =
                        card.isFlipped || gameData.flippedCards?.some((c) => c.id === card.id);
                      const isMatched = card.isMatched;

                      if (isMatched)
                        return (
                          <div
                            key={card.id}
                            className="h-24 md:h-32 opacity-0"
                            data-oid="7kav-mc"
                          />
                        );

                      return (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onCardClick(card)}
                          className={cn(
                            'h-24 md:h-32 p-4 rounded-3xl border-2 flex items-center justify-center text-center cursor-pointer relative overflow-hidden transition-all duration-300 shadow-sm group/card',
                            isFlipped
                              ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                              : 'border-slate-100 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:border-purple-400/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                          )}
                          data-oid="bs7:w12"
                        >
                          <span
                            className="relative z-10 font-black leading-tight select-none text-xs md:text-sm italic tracking-tight break-words text-wrap group-hover/card:scale-105 transition-transform"
                            data-oid="w2q927z"
                          >
                            {card.content}
                          </span>

                          {/* Card Decorative Elements */}
                          <div
                            className="absolute -top-2 -right-2 opacity-5 group-hover/card:opacity-10 transition-opacity"
                            data-oid="g9:jue1"
                          >
                            <Target className="w-16 h-16" data-oid="iqhynnl" />
                          </div>

                          {isFlipped && (
                            <motion.div
                              layoutId="card-glow"
                              className="absolute inset-0 bg-purple-500/5 dark:bg-purple-500/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              data-oid="v2p_.ma"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10 py-10 relative z-10"
                data-oid="cw.9se4"
              >
                <div className="relative w-40 h-40 mx-auto" data-oid="uxuv9dy">
                  <div
                    className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
                    data-oid="yj3:9-g"
                  />

                  <div
                    className="relative w-full h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 dark:border-white/5"
                    data-oid="t64hq:4"
                  >
                    <Trophy
                      className="w-20 h-20 text-yellow-500 drop-shadow-xl animate-bounce"
                      data-oid="ikjjvt1"
                    />
                  </div>
                </div>

                <div className="space-y-4" data-oid="b18d-yd">
                  <h2
                    className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic"
                    data-oid="a1trm.j"
                  >
                    All Matched!
                  </h2>
                  <p
                    className="text-xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest"
                    data-oid="7m25jtb"
                  >
                    You scored{' '}
                    <span className="text-indigo-600 dark:text-indigo-400" data-oid="aqcdv87">
                      {gameScore} points
                    </span>
                  </p>
                </div>

                <div
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 max-w-md mx-auto w-full"
                  data-oid="u9gbo91"
                >
                  <div className="flex justify-between items-center mb-6" data-oid="hy__ndy">
                    <span
                      className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]"
                      data-oid=".i2h589"
                    >
                      Final Score
                    </span>
                    <span
                      className="text-4xl font-black text-emerald-600 italic tracking-tighter"
                      data-oid="43v1wty"
                    >
                      {gameScore}
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-100 dark:bg-white/5 h-2.5 rounded-full overflow-hidden"
                    data-oid="690ns3c"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      data-oid="mpw_3js"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4 justify-center" data-oid="o00x8:p">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    data-oid=".z0h1cc"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={onRestart}
                    className="h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
                    data-oid="t.fmeed"
                  >
                    Play Again
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div
            className="p-20 flex flex-col items-center justify-center h-[600px] gap-6"
            data-oid="8xm3pnh"
          >
            <div className="relative w-16 h-16" data-oid="v1lxb2f">
              <div
                className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"
                data-oid="wnf_h39"
              />

              <div
                className="relative w-full h-full bg-purple-600 rounded-2xl flex items-center justify-center animate-spin duration-1000"
                data-oid="pypk9z_"
              >
                <Target className="w-8 h-8 text-white" data-oid="s0nw.xp" />
              </div>
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse"
              data-oid="9mbzorz"
            >
              Loading game...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
