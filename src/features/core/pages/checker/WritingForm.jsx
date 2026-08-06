import React from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  ImageUp,
  LineChart,
  Loader2,
  PenLine,
  RotateCcw,
  ShieldCheck,
  WandSparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL, NUM, TITLE } from '@/features/dashboard/components/primitives';
import { TASKS } from './checkerConstants';

/**
 * The writing form panel — task tabs, image upload, prompt field, textarea, and actions.
 * Compact learner panel styling with tight padding.
 */
export default function WritingForm({
  activeTask,
  currentDraft,
  wordCount,
  error,
  isAnalysing,
  authLoading,
  showTaskImageField,
  showPromptField,
  taskImageFile,
  onTabChange,
  onUpdateDraft,
  onLoadDemo,
  onClearEssay,
  onPaste,
  onImageChange,
  onSubmit,
}) {
  const task = TASKS[activeTask];

  return (
    <form onSubmit={onSubmit} className={cn(PANEL, 'flex flex-col h-full p-5 sm:p-6')}>
      <TaskTabs activeTask={activeTask} onTabChange={onTabChange} />

      {activeTask === 'Task 1' && showTaskImageField && (
        <Task1ImageField taskImageFile={taskImageFile} onImageChange={onImageChange} />
      )}

      {activeTask === 'Task 2' && showPromptField && (
        <PromptField
          value={currentDraft.prompt}
          onChange={(value) => onUpdateDraft('prompt', value)}
        />
      )}

      <EssayField
        activeTask={activeTask}
        essay={currentDraft.essay}
        wordCount={wordCount}
        minimum={task.minimum}
        onLoadDemo={onLoadDemo}
        onChange={(value) => onUpdateDraft('essay', value)}
      />

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      )}

      <FormActions
        isAnalysing={isAnalysing}
        authLoading={authLoading}
        onClearEssay={onClearEssay}
        onPaste={onPaste}
      />

      <div className="mt-4 flex items-center gap-2 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-3 text-xs leading-snug text-slate-500 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />
        <span>
          Your response is only sent when you request analysis. Your first 3 Academic IELTS writing
          feedback reports are free.
        </span>
      </div>
    </form>
  );
}

/** Task 1 / Task 2 tab switcher. */
function TaskTabs({ activeTask, onTabChange }) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-1 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-1 dark:border-white/[0.07] dark:bg-white/[0.04]"
      role="tablist"
      aria-label="Academic IELTS writing task"
    >
      {Object.keys(TASKS).map((taskType) => (
        <button
          key={taskType}
          type="button"
          role="tab"
          aria-selected={activeTask === taskType}
          onClick={() => onTabChange(taskType)}
          className={cn(
            'flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-xs sm:text-sm font-extrabold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#5a63df]',
            activeTask === taskType
              ? 'border border-[#d6d3eb] bg-white text-[#5a63df] shadow-xs dark:border-white/[0.14] dark:bg-[#5a63df] dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {taskType === 'Task 2' ? (
            <PenLine className="h-4 w-4" />
          ) : (
            <LineChart className="h-4 w-4" />
          )}
          {TASKS[taskType].label}
        </button>
      ))}
    </div>
  );
}

/** Task 2 prompt textarea (shown after analysis is requested). */
function PromptField({ value, onChange }) {
  return (
    <div className="mt-4 rounded-xl border border-[#e4e2f0] bg-[#f8f7fd] p-3.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <label htmlFor="task-prompt" className={cn(TITLE, 'text-xs font-extrabold')}>
        Original Task 2 instructions
      </label>
      <p className="mt-0.5 text-xs leading-4 text-slate-500 dark:text-slate-400">
        Needed after analysis is requested so Task Response is measured against the exact question.
      </p>
      <textarea
        id="task-prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={1500}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        placeholder="Paste the original Academic IELTS Task 2 question here…"
        className="mt-2.5 w-full resize-y rounded-lg border border-[#e4e2f0] bg-white px-3.5 py-2.5 text-xs font-medium leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-[#5a63df]/60"
      />
    </div>
  );
}

/** Main essay textarea with word count indicator. */
function EssayField({ activeTask, essay, wordCount, minimum, onLoadDemo, onChange }) {
  return (
    <div className="mt-4 flex flex-col flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="writing-response"
          className={cn(TITLE, 'text-sm font-extrabold text-slate-900 dark:text-white')}
        >
          Your response
        </label>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={cn(
              NUM,
              'font-bold text-xs px-2.5 py-1 rounded-md border border-[#e4e2f0] bg-[#f4f3fb] dark:border-white/[0.08] dark:bg-white/[0.06]',
              wordCount >= minimum
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300'
            )}
          >
            {wordCount} / {minimum}+ words
          </span>
          <button
            type="button"
            onClick={onLoadDemo}
            className="text-xs font-extrabold text-[#5a63df] hover:underline dark:text-[#afb5ff]"
          >
            Load demo
          </button>
        </div>
      </div>
      <textarea
        id="writing-response"
        value={essay}
        onChange={(event) => onChange(event.target.value)}
        rows={15}
        maxLength={activeTask === 'Task 1' ? 1500 : 2500}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        placeholder={`Paste or write your Academic IELTS ${activeTask} response here…`}
        className="mt-2.5 min-h-[380px] w-full flex-1 resize-y rounded-xl border border-slate-200/90 bg-[#fafafd] px-4 py-3.5 text-sm sm:text-base leading-relaxed text-slate-800 outline-none transition duration-150 placeholder:text-slate-400 focus:border-[#5a63df] focus:bg-white focus:ring-4 focus:ring-[#5a63df]/15 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#5a63df]/80 dark:focus:bg-[#18181b] dark:focus:ring-[#5a63df]/20"
      />
    </div>
  );
}

/** Clear / Paste / Submit action bar. */
function FormActions({ isAnalysing, authLoading, onClearEssay, onPaste }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClearEssay}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5a63df] dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          <RotateCcw className="h-4 w-4" /> Clear
        </button>
        <button
          type="button"
          onClick={onPaste}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5a63df] dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          <ClipboardPaste className="h-4 w-4" /> Paste
        </button>
      </div>
      <button
        type="submit"
        disabled={isAnalysing || authLoading}
        className="inline-flex h-11 min-w-48 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5a63df] to-[#6b72e8] px-6 text-xs sm:text-sm font-black text-white shadow-md shadow-[#5a63df]/25 dark:shadow-none transition hover:from-[#4b54cf] hover:to-[#5a63df] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#5a63df] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAnalysing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
          </>
        ) : (
          <>
            Analyze my writing — Free <WandSparkles className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

/** Task 1 image upload sub-section. */
function Task1ImageField({ taskImageFile, onImageChange }) {
  return (
    <div className="mt-3 rounded-xl border border-[#e4e2f0] bg-[#f8f7fd] p-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e4e2f0] bg-white text-[#5a63df] dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-[#afb5ff]">
          <ImageUp className="h-4 w-4" />
        </div>
        <div>
          <label htmlFor="task-image" className={cn(TITLE, 'text-xs font-extrabold')}>
            Add your original Task 1 visual
          </label>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            Upload the chart, graph, table, map or process image needed for accurate Task
            Achievement feedback.
          </p>
        </div>
      </div>
      <input
        id="task-image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onImageChange}
        className="mt-2.5 block w-full rounded-lg border border-[#e4e2f0] bg-white p-1.5 text-xs font-semibold text-slate-600 file:mr-2.5 file:rounded-md file:border-0 file:bg-[#5a63df] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#4b54cf] dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-slate-300"
      />
      {taskImageFile && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {taskImageFile.name}
        </p>
      )}
    </div>
  );
}
