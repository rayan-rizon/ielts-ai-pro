import { FilePenLine, Headphones, Mic2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';

function criterionIcon(source) {
  return source === 'speaking' ? Mic2 : FilePenLine;
}

/**
 * Writing & Speaking evidence panel, extracted from GrammarDashboard.
 */
export default function GrammarEvidencePanel({ criterionEvidence }) {
  return (
    <div
      id="grammar-evidence"
      className="relative scroll-mt-6 overflow-hidden bg-gradient-to-br from-white via-[#faf9ff] to-[#f3f0ff] p-4 sm:p-5 dark:from-[#10131f] dark:to-[#10131f]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#6570ee]/10 blur-xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] shadow-sm ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/30">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              Writing &amp; Speaking evidence
            </h2>
            <p className="mt-0.5 text-[11px] font-medium leading-normal text-slate-500 dark:text-slate-400">
              Criterion evidence from your evaluated practice.
            </p>
          </div>
        </div>
        {criterionEvidence.length > 0 && (
          <span className="mt-0.5 shrink-0 rounded-full border border-[#d8dcfa] bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold text-[#505bdd] shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            {criterionEvidence.length} sources
          </span>
        )}
      </div>

      <div className="relative mt-3 space-y-2.5">
        {criterionEvidence.length ? (
          criterionEvidence.map((signal) => {
            const Icon = criterionIcon(signal.source);
            const isSpeaking = signal.source === 'speaking';
            const formattedProvenance = (signal.provenance || '')
              .replace(
                'Speaking grammatical range and accuracy criterion',
                'Grammatical range & accuracy'
              )
              .replace(
                'Writing grammatical range and accuracy criterion',
                'Grammatical range & accuracy'
              )
              .replace('· transcript-based', '• Transcript-based');
            return (
              <div
                key={signal.skillCode}
                className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 p-3 sm:p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6570ee]/40 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span
                  className={cn(
                    'absolute bottom-2 left-0 top-2 w-1 rounded-r-full transition-colors duration-200',
                    isSpeaking ? 'bg-emerald-500' : 'bg-[#505bdd]'
                  )}
                />
                <div className="flex items-center gap-3 pl-1.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105',
                      isSpeaking
                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-[#efedff] text-[#505bdd] ring-1 ring-[#505bdd]/15 dark:bg-indigo-500/15 dark:text-indigo-300'
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                        {signal.source} Grammar
                      </span>
                      <GrammarEvidenceBadge
                        evidenceClass={signal.evidenceClass}
                        observations={signal.observations}
                        compact
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {formattedProvenance}
                      </p>
                      <svg
                        className={cn(
                          'hidden sm:block h-4 w-12 shrink-0 opacity-60 transition-opacity group-hover:opacity-100',
                          isSpeaking ? 'text-emerald-500' : 'text-[#505bdd]'
                        )}
                        viewBox="0 0 60 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d={
                            isSpeaking
                              ? 'M2 14C10 14 15 6 22 10C29 14 35 4 42 7C49 10 52 2 58 4'
                              : 'M2 12C8 16 14 4 22 8C30 12 36 6 44 11C52 16 55 5 58 3'
                          }
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[#dfe2f1] p-3 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
            Complete scored Writing or Speaking practice to add criterion evidence here.
          </div>
        )}
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2.5 border-t border-[#e3e6f5] pt-3 dark:border-white/10">
        <Link
          to="/writing"
          className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d8dcfa] bg-white/90 text-xs font-extrabold text-[#505bdd] shadow-sm transition-all hover:border-[#aeb5f7] hover:bg-white hover:shadow dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
        >
          <FilePenLine className="h-3.5 w-3.5" /> Go to Writing
        </Link>
        <Link
          to="/speaking"
          className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d8dcfa] bg-white/90 text-xs font-extrabold text-[#505bdd] shadow-sm transition-all hover:border-[#aeb5f7] hover:bg-white hover:shadow dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
        >
          <Headphones className="h-3.5 w-3.5" /> Go to Speaking
        </Link>
      </div>
    </div>
  );
}
