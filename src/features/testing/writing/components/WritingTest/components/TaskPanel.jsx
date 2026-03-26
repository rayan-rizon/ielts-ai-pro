import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lightbulb, ChevronUp, ChevronDown, AlertTriangle, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatInstructionHTML, getProxiedImageUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/security';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

/**
 * Image display component with premium styling and zoom capability
 */
function ImageDisplay({ imageUrl: rawImageUrl }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = React.useMemo(() => getProxiedImageUrl(rawImageUrl), [rawImageUrl]);

  if (!imageUrl) return null;

  if (hasError) {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 text-center w-full"
        data-oid="r0_5hwj"
      >
        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" data-oid="h5f.wp4" />
        <p className="text-amber-700 dark:text-amber-400 font-medium text-sm" data-oid="dg0hae4">
          Image referenced in task could not be loaded
        </p>
      </div>
    );
  }

  return (
    <Dialog data-oid="v1hltkq">
      <DialogTrigger asChild data-oid="mjxjwpl">
        <div
          className="group relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden cursor-zoom-in transition-all duration-300 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 w-full"
          data-oid="y5v0kqo"
        >
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 animate-pulse z-10"
              data-oid="1lb4kmo"
            >
              <span className="text-slate-400 text-sm font-medium" data-oid="8f-:a25">
                Loading task visual...
              </span>
            </div>
          )}

          <div
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            data-oid="bz2gkkn"
          >
            <div
              className="bg-black/50 backdrop-blur-md text-white p-2 rounded-full"
              data-oid="0tfznl7"
            >
              <ZoomIn className="w-4 h-4" data-oid="ys85w8_" />
            </div>
          </div>

          <img
            src={imageUrl}
            alt="Task Reference"
            className={`w-full h-auto object-contain bg-white dark:bg-black/20 transition-all duration-500 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              console.error('Image load failed inside ImageDisplay:', imageUrl);
              setIsLoading(false);
              setHasError(true);
            }}
            data-oid="sfxpsot"
          />
        </div>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none overflow-hidden"
        data-oid="8fy663d"
      >
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          data-oid="m0jh-p3"
        >
          {/* Pointer events none on container to let clicks pass if needed, but DialogOverlay handles closing */}
          <img
            src={imageUrl}
            alt="Task Reference Full"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl pointer-events-auto bg-white"
            data-oid="45ne7qb"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TaskPanel({ task, showSample, setShowSample, isInset = false }) {
  if (!task) return null;

  return (
    <motion.div
      initial={!isInset ? { y: 15, opacity: 0 } : { opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={!isInset ? { y: 15, opacity: 0 } : { opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col relative z-0',
        !isInset
          ? 'h-1/2 lg:h-full w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-[#0a0a0a] backdrop-blur-sm'
          : 'h-full w-full'
      )}
      data-oid="zit35s_"
    >
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        data-oid="ull-mmp"
      >
        {/* Instructions Card */}
        <div
          className="px-5 py-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm border border-indigo-100 dark:border-indigo-900/30"
          data-oid="kd_:al8"
        >
          <div
            className="flex items-center gap-2 mb-3 pb-2 border-b border-indigo-200/50 dark:border-indigo-800/30"
            data-oid="pxbquvx"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" data-oid="nqqeqwk" />
            <span
              className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest"
              data-oid="jdu8sva"
            >
              Instructions
            </span>
          </div>
          {task.instructions && (
            <div
              className="prose prose-slate dark:prose-invert max-w-none 
                         prose-p:text-slate-700 dark:prose-p:text-slate-300 
                         prose-p:text-base prose-p:font-medium prose-p:leading-snug
                         prose-headings:font-bold prose-headings:text-sm prose-headings:my-1
                         [&_p]:my-0 [&_p+p]:mt-1"
              dangerouslySetInnerHTML={{ __html: formatInstructionHTML(task.instructions) }}
              data-oid="-lym03:"
            />
          )}
        </div>

        {/* Prompt/Question Card */}
        <div
          className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-slate-800 dark:text-slate-200 shadow-sm"
          data-oid="3t_zrfc"
        >
          <h3
            className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2 opacity-80"
            data-oid="xfg.e76"
          >
            Essay Topic
          </h3>
          <div
            className="text-base font-serif font-medium leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                task.prompt ||
                  (typeof task.content === 'string' && !task.content.startsWith('{')
                    ? task.content
                    : '') ||
                  '<em class="text-slate-400">Task content not available. Please select a different task or contact support.</em>'
              ),
            }}
            data-oid="ah152is"
          />
        </div>

        {/* Enhanced Image Display */}
        {task.image_url && <ImageDisplay imageUrl={task.image_url} data-oid="d5.uiql" />}

        {/* Sample Answer Toggle */}
        {task.sample_answer && (
          <div className="pt-1" data-oid="b7qzctz">
            <Button
              variant="ghost"
              onClick={() => setShowSample(!showSample)}
              className={`w-full justify-between items-center group h-auto py-3 px-4 rounded-2xl border transition-all duration-300 ${
                showSample
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
              }`}
              data-oid="4jmai9z"
            >
              <div className="flex items-center gap-2.5" data-oid=".agen5.">
                <div
                  className={`p-1.5 rounded-full transition-colors ${showSample ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'}`}
                  data-oid="axd8hp2"
                >
                  <Lightbulb className="w-3.5 h-3.5" data-oid="p1no2wj" />
                </div>
                <span
                  className={`text-sm font-bold transition-colors ${showSample ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200'}`}
                  data-oid="g.-gq0i"
                >
                  Sample Answer
                </span>
              </div>
              {showSample ? (
                <ChevronUp className="w-4 h-4 text-amber-500" data-oid="5eeg9vc" />
              ) : (
                <ChevronDown
                  className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors"
                  data-oid="bo_x25z"
                />
              )}
            </Button>

            <AnimatePresence data-oid="gdl19kk">
              {showSample && (
                <motion.div
                  initial={{ height: 0, opacity: 0, translateY: -5 }}
                  animate={{ height: 'auto', opacity: 1, translateY: 0 }}
                  exit={{ height: 0, opacity: 0, translateY: -5 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                  data-oid=".gz5-z_"
                >
                  <div
                    className="mt-2 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30 text-base leading-relaxed shadow-inner"
                    data-oid="b-ecjg0"
                  >
                    <div
                      className="ql-editor !p-0 !min-h-0 prose prose-slate dark:prose-invert max-w-none 
                                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-8
                                prose-headings:font-bold prose-headings:text-amber-900 dark:prose-headings:text-amber-100
                                [&>p]:mb-4 [&_p]:mb-4 space-y-4 [&>*:first-child]:mt-0 font-serif"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.sample_answer || '') }}
                      data-oid="ib.uee1"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
