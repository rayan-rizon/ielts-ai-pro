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
import { TASKS } from './checkerConstants';

/**
 * The writing form panel — task tabs, image upload, prompt field, textarea, and actions.
 * Extracted from CheckerWorkspace to reduce its LoC and cc.
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
    <form
      onSubmit={onSubmit}
      className="h-full rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:shadow-none"
    >
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
          className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
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

      <div className="mt-5 flex items-start gap-2.5 border-t border-slate-100 dark:border-white/10 pt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
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
      className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-white/[0.04] p-1.5"
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
            'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-indigo-500',
            activeTask === taskType
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-white/10 dark:text-indigo-300 dark:shadow-none dark:ring-white/10'
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
    <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.08]">
      <label
        htmlFor="task-prompt"
        className="text-sm font-extrabold text-slate-900 dark:text-slate-100"
      >
        Original Task 2 instructions
      </label>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Needed after analysis is requested so Task Response is measured against the exact question.
      </p>
      <textarea
        id="task-prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={1500}
        placeholder="Paste the original Academic IELTS Task 2 question here…"
        className="mt-3 w-full resize-y rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/60 dark:focus:ring-indigo-500/10"
      />
    </div>
  );
}

/** Main essay textarea with word count indicator. */
function EssayField({ activeTask, essay, wordCount, minimum, onLoadDemo, onChange }) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor="writing-response"
          className="text-sm font-extrabold text-slate-900 dark:text-slate-100"
        >
          Your response
        </label>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span
            className={
              wordCount >= minimum
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {wordCount} / {minimum}+ words
          </span>
          <button
            type="button"
            onClick={onLoadDemo}
            className="text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Load demo
          </button>
        </div>
      </div>
      <textarea
        id="writing-response"
        value={essay}
        onChange={(event) => onChange(event.target.value)}
        rows={17}
        maxLength={activeTask === 'Task 1' ? 1500 : 2500}
        placeholder={`Paste or write your Academic IELTS ${activeTask} response here…`}
        className="mt-3 min-h-[330px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/60 dark:focus:ring-indigo-500/10"
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
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.04]"
        >
          <RotateCcw className="h-4 w-4" /> Clear
        </button>
        <button
          type="button"
          onClick={onPaste}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.04]"
        >
          <ClipboardPaste className="h-4 w-4" /> Paste
        </button>
      </div>
      <button
        type="submit"
        disabled={isAnalysing || authLoading}
        className="inline-flex h-12 min-w-52 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 dark:shadow-none transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.08]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-white/[0.06] dark:text-indigo-400 dark:shadow-none">
          <ImageUp className="h-5 w-5" />
        </div>
        <div>
          <label
            htmlFor="task-image"
            className="text-sm font-extrabold text-slate-900 dark:text-slate-100"
          >
            Add your original Task 1 visual
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
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
        className="mt-4 block w-full rounded-xl border border-indigo-200 bg-white p-2 text-xs font-semibold text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-extrabold file:text-white hover:file:bg-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
      />
      {taskImageFile && (
        <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> {taskImageFile.name}
        </p>
      )}
    </div>
  );
}
