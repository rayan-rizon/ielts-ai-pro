import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, X, StickyNote, Trash2, Send } from 'lucide-react';

const ReadingTestNotes = ({
  showNotes,
  setShowNotes,
  notes,
  onRemoveNote,
  onAddNote,
  newNote,
  setNewNote,
  onNavigateToRef,
}) => {
  // Add effect to auto-scroll to bottom of notes when opened or added
  const notesContainerRef = useRef(null);
  useEffect(() => {
    if (showNotes && notesContainerRef.current) {
      notesContainerRef.current.scrollTop = notesContainerRef.current.scrollHeight;
    }
  }, [showNotes, notes.length]);

  return (
    <AnimatePresence data-oid="95ry5:5">
      {showNotes && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" // Increased z-index
            onClick={() => setShowNotes(false)}
            data-oid="khhy5n4"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-lg z-[100] flex flex-col" // Increased width for mobile
            data-oid="jf_oqb8"
          >
            {/* Header */}
            <div
              className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md"
              data-oid="5179b1m"
            >
              <div className="flex items-center gap-3" data-oid="hp.6fbm">
                <div
                  className="w-10 h-10 bg-[#5a63df]/10 dark:bg-[#5a63df]/20 rounded-xl flex items-center justify-center"
                  data-oid="97cjv4j"
                >
                  <FileText
                    className="w-5 h-5 text-[#5a63df] dark:text-[#a9afff]"
                    data-oid="n3.o1.2"
                  />
                </div>
                <div data-oid="nf3wx_p">
                  <h3
                    className="font-bold text-lg text-slate-800 dark:text-white"
                    data-oid="ow_wu-a"
                  >
                    Study Notes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400" data-oid="yuj5ksf">
                    {notes.length} note{notes.length !== 1 ? 's' : ''} saved
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotes(false)}
                className="h-9 w-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                data-oid="h:_vnje"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" data-oid="oma2xmk" />
              </Button>
            </div>

            {/* Notes List */}
            <div
              ref={notesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              data-oid="9lzf:5."
            >
              {notes.length === 0 ? (
                <div
                  className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700"
                  data-oid="twmgdlq"
                >
                  <div
                    className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
                    data-oid="yd-6mb3"
                  >
                    <StickyNote
                      className="w-8 h-8 text-slate-300 dark:text-slate-600"
                      data-oid="zvk858x"
                    />
                  </div>
                  <h4
                    className="font-semibold text-slate-700 dark:text-slate-300"
                    data-oid="66giiil"
                  >
                    No notes yet
                  </h4>
                  <p
                    className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[200px]"
                    data-oid="u1t:0_a"
                  >
                    Highlight text in the passage to add a contextual note, or type below.
                  </p>
                </div>
              ) : (
                [...notes].reverse().map((note) => (
                  <motion.div
                    layout
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:border-[#5a63df]/30 dark:hover:border-[#5a63df]/40"
                    data-oid="x_yfsee"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2" data-oid="iqgqdp4">
                      <div className="flex items-center gap-2" data-oid="1h.rvg5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider bg-[#5a63df]/10 dark:bg-[#5a63df]/20 text-[#5a63df] dark:text-[#a9afff] border-[#5a63df]/20 dark:border-[#5a63df]/25"
                          data-oid="ow7wk3v"
                        >
                          Passage {note.passageIndex + 1}
                        </Badge>
                        <span
                          className="text-[10px] text-slate-400 dark:text-slate-500 font-medium"
                          data-oid="2nx-mv2"
                        >
                          {new Date(note.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveNote(note.id)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                        data-oid="w6hlgpn"
                      >
                        <Trash2 className="w-3.5 h-3.5" data-oid="7dymy_i" />
                      </Button>
                    </div>

                    <p
                      className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
                      data-oid="3067edw"
                    >
                      {note.content.split('\n\n').map((part, i) => {
                        const isRef = i === 0 && part.startsWith('Ref: "');
                        return (
                          <span
                            key={i}
                            onClick={() => isRef && onNavigateToRef && onNavigateToRef(part)}
                            className={
                              isRef
                                ? 'block italic text-[#5a63df] dark:text-[#a9afff] bg-[#5a63df]/[0.06] dark:bg-[#5a63df]/10 p-2 rounded border border-[#5a63df]/15 dark:border-[#5a63df]/20 mb-2 cursor-pointer hover:bg-[#5a63df]/10 dark:hover:bg-[#5a63df]/20 transition-colors'
                                : ''
                            }
                            data-oid="9tbl1d."
                          >
                            {part}
                          </span>
                        );
                      })}
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div
              className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md"
              data-oid="s7ob.mz"
            >
              <div className="relative group" data-oid="ur:c18h">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your notes here..."
                  className="min-h-[100px] w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#5a63df]/20 focus:border-[#5a63df] transition-all rounded-xl resize-none p-4 pr-12 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newNote.trim()) onAddNote();
                    }
                  }}
                  data-oid="0orxzt0"
                />

                <Button
                  onClick={onAddNote}
                  disabled={!newNote.trim()}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-[#5a63df] hover:bg-[#4a52c9] text-white shadow-xs transition-all disabled:opacity-50"
                  data-oid=".9ae3a0"
                >
                  <Send className="w-4 h-4" data-oid="5oakqpb" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReadingTestNotes;
