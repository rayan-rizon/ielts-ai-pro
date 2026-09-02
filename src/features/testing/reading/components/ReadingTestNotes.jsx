import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, X, StickyNote, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-100" // Increased z-index
            onClick={() => setShowNotes(false)}
            data-oid="khhy5n4"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              PANEL,
              'fixed right-0 top-0 z-100 flex h-full w-full flex-col rounded-none border-y-0 border-r-0 shadow-xl sm:w-96'
            )}
            data-oid="jf_oqb8"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-[#e4e2f0] bg-white/85 p-3.5 backdrop-blur-md dark:border-white/10 dark:bg-[#131315]/90"
              data-oid="5179b1m"
            >
              <div className="flex items-center gap-3" data-oid="hp.6fbm">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5a63df]/10 dark:bg-[#8f97ff]/18"
                  data-oid="97cjv4j"
                >
                  <FileText
                    className="h-4.5 w-4.5 text-[#5a63df] dark:text-[#afb5ff]"
                    data-oid="n3.o1.2"
                  />
                </div>
                <div data-oid="nf3wx_p">
                  <h3
                    className="text-base font-bold text-slate-900 dark:text-slate-100"
                    data-oid="ow_wu-a"
                  >
                    Study Notes
                  </h3>
                  <p className={cn(MUTED, 'text-[11px] font-medium')} data-oid="yuj5ksf">
                    {notes.length} note{notes.length !== 1 ? 's' : ''} saved
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotes(false)}
                className="h-8 w-8 rounded-lg text-slate-500 transition-colors hover:bg-[#f4f3fb] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-100"
                data-oid="h:_vnje"
              >
                <X className="h-4 w-4" data-oid="oma2xmk" />
              </Button>
            </div>

            {/* Notes List */}
            <div
              ref={notesContainerRef}
              className="flex-1 space-y-3 overflow-y-auto p-3.5 scroll-smooth"
              data-oid="9lzf:5."
            >
              {notes.length === 0 ? (
                <div
                  className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#d9d9eb] bg-[#fbfbfe] p-5 text-center dark:border-white/16 dark:bg-white/5.5"
                  data-oid="twmgdlq"
                >
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f3fb] dark:bg-white/8"
                    data-oid="yd-6mb3"
                  >
                    <StickyNote
                      className="h-6 w-6 text-slate-400 dark:text-slate-500"
                      data-oid="zvk858x"
                    />
                  </div>
                  <h4
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                    data-oid="66giiil"
                  >
                    No notes yet
                  </h4>
                  <p
                    className={cn(MUTED, 'mt-1.5 max-w-[200px] text-xs leading-relaxed')}
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
                    className={cn(
                      TILE,
                      'group p-3 transition-all hover:border-[#5a63df]/30 hover:shadow-sm dark:hover:border-[#8f97ff]/40'
                    )}
                    data-oid="x_yfsee"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2" data-oid="iqgqdp4">
                      <div className="flex items-center gap-2" data-oid="1h.rvg5">
                        <Badge
                          variant="outline"
                          className="h-4 rounded-md border-[#5a63df]/20 bg-[#5a63df]/10 px-1.5 py-0 text-[8px] font-bold uppercase leading-none tracking-[0.08em] text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff]"
                          data-oid="ow7wk3v"
                        >
                          Passage {note.passageIndex + 1}
                        </Badge>
                        <span
                          className="text-[10px] font-medium text-slate-400 dark:text-slate-500"
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
                        className="h-6 w-6 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-400/12 dark:hover:text-rose-300"
                        data-oid="w6hlgpn"
                      >
                        <Trash2 className="w-3.5 h-3.5" data-oid="7dymy_i" />
                      </Button>
                    </div>

                    <p
                      className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300"
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
                                ? 'mb-2 block cursor-pointer rounded-md border border-[#5a63df]/15 bg-[#5a63df]/6 p-2 italic text-[#5a63df] transition-colors hover:bg-[#5a63df]/10 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/8 dark:text-[#afb5ff] dark:hover:bg-[#8f97ff]/[0.14]'
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
              className="border-t border-[#e4e2f0] bg-[#f4f3fb] p-3.5 backdrop-blur-md dark:border-white/10 dark:bg-white/5.5"
              data-oid="s7ob.mz"
            >
              <div className="relative group" data-oid="ur:c18h">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your notes here..."
                  className="min-h-[88px] w-full resize-none rounded-lg border-[#e4e2f0] bg-white p-3 pr-11 text-sm transition-all focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/12 dark:bg-[#131315]"
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
                  className="absolute bottom-2 right-2 h-7 w-7 rounded-lg bg-[#5a63df] text-white shadow-none transition-all hover:bg-[#4f58d2] disabled:opacity-50"
                  data-oid=".9ae3a0"
                >
                  <Send className="h-3.5 w-3.5" data-oid="5oakqpb" />
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
