import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import SkillVisual from './SkillVisual';
import { skillLabel } from '../constants';

const SKILL_VISUALS = {
  grammar_sentence_boundaries: {
    panelClass: 'from-[#fdfcff] to-[#f3efff]',
    cardClass: 'hover:border-violet-200',
  },
  grammar_verb_forms: {
    panelClass: 'from-[#fcfeff] to-[#edf5ff]',
    cardClass: 'hover:border-blue-200',
  },
  grammar_agreement_number: {
    panelClass: 'from-[#fcfffd] to-[#edf9f3]',
    cardClass: 'hover:border-emerald-200',
  },
  grammar_articles_determiners: {
    panelClass: 'from-[#fffefd] to-[#fff3e9]',
    cardClass: 'hover:border-orange-200',
  },
  grammar_clause_control: {
    panelClass: 'from-[#fcfeff] to-[#eaf8fb]',
    cardClass: 'hover:border-cyan-200',
  },
  grammar_word_forms: {
    panelClass: 'from-[#fffdfd] to-[#fff0f8]',
    cardClass: 'hover:border-pink-200',
  },
};

/**
 * IELTS grammar guides grid, extracted from GrammarDashboard.
 */
export default function GrammarGuidesPanel({ resources, resourcesUnavailable }) {
  return (
    <section id="grammar-guides" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            IELTS grammar guides
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Learn one rule, see it in IELTS, then try a short practice set.
          </p>
        </div>
        <Link
          to="/grammar#grammar-guides"
          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5661e9]"
        >
          View all guides <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {resourcesUnavailable ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#dfe2f1] p-4 text-xs font-medium text-slate-500">
          Guides are temporarily unavailable. Your practice and evidence are still ready.
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(resources || []).map((resource) => {
            const visual = SKILL_VISUALS[resource.skill_code] || SKILL_VISUALS.grammar_word_forms;
            return (
              <Link
                key={resource.id}
                to={`/grammar/guides/${resource.slug}`}
                className={cn(
                  'group flex min-h-[148px] flex-col justify-between rounded-2xl border border-[#eceafa] bg-gradient-to-br p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] dark:border-white/10 dark:bg-white/[0.025]',
                  visual.panelClass,
                  visual.cardClass
                )}
              >
                <div>
                  <SkillVisual skillCode={resource.skill_code} compact />
                  <div className="mt-2.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#5c66dc]">
                    {skillLabel(resource.skill_code)}
                  </div>
                  <div className="mt-1 text-xs font-extrabold leading-4 text-slate-900 dark:text-white">
                    {resource.title}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{resource.estimated_minutes} min</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
