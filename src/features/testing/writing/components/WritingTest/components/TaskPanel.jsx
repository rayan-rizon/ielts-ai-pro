import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  ZoomIn,
  Clock,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatInstructionHTML, getProxiedImageUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/security';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { PANEL } from '@/features/dashboard/components/primitives';

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
        className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/10 p-4 text-center w-full"
        data-oid="r0_5hwj"
      >
        <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" data-oid="h5f.wp4" />
        <p className="text-amber-700 dark:text-amber-400 font-medium text-xs" data-oid="dg0hae4">
          Image referenced in task could not be loaded
        </p>
      </div>
    );
  }

  return (
    <Dialog data-oid="v1hltkq">
      <DialogTrigger asChild data-oid="mjxjwpl">
        <div
          className="group relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden cursor-zoom-in transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 w-full flex items-center justify-center p-1.5 sm:p-2"
          data-oid="y5v0kqo"
        >
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 animate-pulse z-10"
              data-oid="1lb4kmo"
            >
              <span className="text-slate-400 text-xs font-medium" data-oid="8f-:a25">
                Loading task visual...
              </span>
            </div>
          )}

          <div
            className="absolute top-2 right-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
            data-oid="bz2gkkn"
          >
            <div
              className="bg-black/60 text-white px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-semibold"
              data-oid="0tfznl7"
            >
              <ZoomIn className="w-3.5 h-3.5" data-oid="ys85w8_" />
              <span>Tap to zoom</span>
            </div>
          </div>

          <img
            src={imageUrl}
            alt="Task Reference Visual"
            className={`w-full max-h-[280px] sm:max-h-[380px] md:max-h-[460px] h-auto object-contain bg-white dark:bg-black/20 rounded-lg transition-all duration-300 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
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
        className="max-w-4xl w-full p-2 sm:p-4 bg-white/95 dark:bg-[#131315]/95 border border-[#e4e2f0] dark:border-white/10 shadow-lg overflow-hidden"
        data-oid="8fy663d"
      >
        <DialogTitle className="sr-only">Task Reference Visual</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center" data-oid="m0jh-p3">
          <img
            src={imageUrl}
            alt="Task Reference Full"
            className="max-w-full max-h-[85vh] rounded-lg object-contain bg-white dark:bg-black/20"
            data-oid="45ne7qb"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskPanelView({
  task,
  showSample,
  setShowSample,
  isInset = false,
  allowSample = true,
  onSwitchToEditor,
}) {
  const activeType = task?.activeType || 'Task 1';
  const activeTask = task;

  if (!activeTask) return null;

  return (
    <motion.div
      initial={!isInset ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={!isInset ? { opacity: 0 } : { opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative z-0 flex min-h-0 min-w-0 flex-col',
        !isInset
          ? 'h-full md:h-full w-full md:w-1/2 md:basis-1/2 md:flex-1 border-b md:border-b-0 md:border-r border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#100f15]'
          : 'h-full w-full'
      )}
      data-oid="zit35s_"
    >
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2.5 sm:p-3.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        data-oid="ull-mmp"
      >
        {/* Unified Writing Task Card */}
        <div className={cn(PANEL, 'overflow-hidden')} data-oid="unified-card">
          {/* Card Header & Parameters */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 border-b border-[#ebeaf7] dark:border-white/[0.07] bg-[#f4f3fb]/50 dark:bg-white/3"
            data-oid="card-header"
          >
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {activeType}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-[9px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 py-0 px-1.5 shrink-0 whitespace-nowrap"
                  >
                    {activeType === 'Task 2' ? 'Essay' : 'Report'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Visual Tags */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-[10px] py-0.5 px-2 font-medium"
                variant="outline"
              >
                <Clock className="w-3 h-3" />
                <span>{activeType === 'Task 2' ? '40 Mins' : '20 Mins'}</span>
              </Badge>
              <Badge
                className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1 text-[10px] py-0.5 px-2 font-medium"
                variant="outline"
              >
                <FileText className="w-3 h-3" />
                <span>{activeType === 'Task 2' ? 'Min 250 Words' : 'Min 150 Words'}</span>
              </Badge>
            </div>
          </div>

          {/* Instructions Section */}
          {activeTask.instructions && (
            <div className="px-3.5 py-2 bg-[#f4f3fb]/20 dark:bg-transparent border-b border-[#ebeaf7] dark:border-white/[0.07]">
              <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">
                Instructions
              </h4>
              <div
                className="prose prose-slate dark:prose-invert max-w-none 
                           prose-p:text-slate-600 dark:prose-p:text-slate-300 
                           prose-p:text-[11.5px] sm:prose-p:text-[12px] prose-p:font-normal prose-p:leading-snug
                           [&_p]:my-0 [&_p+p]:mt-0.5"
                dangerouslySetInnerHTML={{ __html: formatInstructionHTML(activeTask.instructions) }}
              />
            </div>
          )}

          {/* Essay Topic Section */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-transparent">
            <h4 className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1 opacity-90">
              Essay Topic
            </h4>
            <div
              className="text-sm font-serif font-medium leading-relaxed text-slate-800 dark:text-slate-100 border-l-2 border-orange-500/40 pl-3 py-0.5 bg-orange-500/1 dark:bg-orange-500/0.5 rounded-r-lg"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  activeTask.prompt ||
                    (typeof activeTask.content === 'string' && !activeTask.content.startsWith('{')
                      ? activeTask.content
                      : '') ||
                    '<em class="text-slate-400">Task content not available. Please select a different task or contact support.</em>'
                ),
              }}
            />
          </div>
        </div>

        {/* Enhanced Image Display */}
        {activeTask.image_url && (
          <ImageDisplay imageUrl={activeTask.image_url} data-oid="d5.uiql" />
        )}

        {/* Sample Answer Toggle */}
        {allowSample && activeTask.sample_answer && (
          <div className="pt-1" data-oid="b7qzctz">
            <Button
              variant="ghost"
              aria-expanded={showSample}
              aria-controls="sample-answer-accordion"
              onClick={() => setShowSample(!showSample)}
              className={`w-full justify-between items-center group h-auto py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
                showSample
                  ? 'bg-amber-500/5 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 shadow-xs'
                  : 'bg-[#fbfbfe] dark:bg-white/3 border-[#e4e2f0] dark:border-white/[0.07] hover:bg-amber-500/5 hover:border-amber-500/30 dark:hover:bg-amber-500/5 dark:hover:border-amber-500/20'
              }`}
              data-oid="4jmai9z"
            >
              <div className="flex items-center gap-2.5" data-oid=".agen5.">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${showSample ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-amber-500/20 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}
                  data-oid="axd8hp2"
                >
                  <Lightbulb className="w-3.5 h-3.5" data-oid="p1no2wj" />
                </div>
                <span
                  className={`text-xs sm:text-sm font-bold transition-colors ${showSample ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-200'}`}
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
                  id="sample-answer-accordion"
                  role="region"
                  aria-label="Sample Answer"
                  initial={{ height: 0, opacity: 0, translateY: -5 }}
                  animate={{ height: 'auto', opacity: 1, translateY: 0 }}
                  exit={{ height: 0, opacity: 0, translateY: -5 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="overflow-hidden"
                  data-oid=".gz5-z_"
                >
                  <div
                    className="mt-2 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-500/[0.03] border border-amber-200/60 dark:border-amber-900/30 text-sm sm:text-base leading-relaxed"
                    data-oid="b-ecjg0"
                  >
                    <div
                      className="ql-editor p-0! min-h-0! prose prose-slate dark:prose-invert max-w-none 
                                prose-p:text-slate-700 dark:prose-p:text-slate-200 prose-p:leading-7 sm:prose-p:leading-8
                                prose-headings:font-bold prose-headings:text-amber-950 dark:prose-headings:text-amber-100
                                [&>p]:mb-3 [&_p]:mb-3 space-y-3 [&>*:first-child]:mt-0 font-serif"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(activeTask.sample_answer || ''),
                      }}
                      data-oid="ib.uee1"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mobile quick CTA to jump to Editor */}
        {onSwitchToEditor && (
          <div className="pt-2 pb-4 md:hidden">
            <Button
              onClick={onSwitchToEditor}
              className="w-full flex items-center justify-center gap-2 h-9.5 rounded-xl bg-[#5a63df] hover:bg-[#4d55c7] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Write Your Response</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TaskPanel(props) {
  const activeType = useWritingTestStore((state) => state.activeType) || 'Task 1';
  const compositeTasks = useWritingTestStore((state) => state.compositeTasks);
  const activeTask = useMemo(
    () =>
      !props.task && !compositeTasks?.[activeType]
        ? null
        : compositeTasks?.[activeType]
          ? { ...props.task, ...compositeTasks[activeType], activeType }
          : { ...props.task, activeType },
    [activeType, compositeTasks, props.task]
  );
  return <TaskPanelView {...props} task={activeTask} />;
}
export { TaskPanelView };
