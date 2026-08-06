import React from 'react';
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SpeakingReportErrorState({ evaluationError, onRetryEvaluation }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f7f6fd] p-4 text-center dark:bg-[#08080a] sm:p-6">
      <section
        role="alert"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#e4e2f0] bg-white px-5 py-7 shadow-[0_22px_70px_-38px_rgba(244,63,94,0.18)] dark:border-white/10 dark:bg-[#131315] dark:shadow-[0_22px_70px_-38px_rgba(244,63,94,0.45)] sm:px-8 sm:py-8"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-rose-500/6 blur-3xl dark:bg-rose-500/8"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.10)] dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:shadow-[0_0_30px_rgba(244,63,94,0.12)]">
            <AlertCircle className="h-7 w-7" strokeWidth={2.2} />
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-600/80 dark:text-rose-300/80">
              Speaking report · needs attention
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              Analysis failed
            </h2>
            <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              We couldn’t finish processing this speaking test. {evaluationError}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button
              variant="outline"
              asChild
              className="order-1 h-10 rounded-xl border-[#e4e2f0] bg-white px-4 text-xs font-extrabold text-slate-600 transition-all hover:border-[#d5d2e6] hover:bg-[#f4f3fb] hover:text-slate-900 dark:border-white/12 dark:bg-transparent dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/6 dark:hover:text-white"
            >
              <Link to="/speaking">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Tests
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="order-2 h-10 rounded-xl border-[#e4e2f0] bg-white px-4 text-xs font-extrabold text-slate-600 transition-all hover:border-[#d5d2e6] hover:bg-[#f4f3fb] hover:text-slate-900 dark:border-white/12 dark:bg-transparent dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/6 dark:hover:text-white"
            >
              <Link to="/dashboard">
                <Home className="mr-2 h-3.5 w-3.5" />
                Home
              </Link>
            </Button>
            <Button
              onClick={onRetryEvaluation}
              size="lg"
              className="order-3 h-10 rounded-xl bg-rose-600 px-4 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 hover:shadow-rose-500/30 active:scale-[0.98]"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>

          <p className="mt-5 border-t border-[#eceaf7] pt-4 text-[11px] font-medium text-slate-500 dark:border-white/[0.07] dark:text-slate-500">
            Your answers are still saved. You can retry the analysis without retaking the test.
          </p>
        </div>
      </section>
    </div>
  );
}
