import React from 'react';
import { cn } from '@/lib/cn';
import {
  Mic2,
  CheckCircle2,
  TrendingUp,
  Target,
  BookOpen,
  Lightbulb,
  Shapes,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PRACTICE_TIPS = {
  '/θ/': 'practice: think/sink, three/free, bath/bass',
  '/r/': 'practice: right/light, red/led, row/low',
  '/v/': 'practice: very/berry, vest/best, vine/wine',
};

const getSeverityColor = (severity) => {
  if (severity === 'major') return 'bg-red-500';
  if (severity === 'moderate') return 'bg-amber-500';
  return 'bg-yellow-400';
};

const getPracticeTip = (firstSound) => {
  if (!firstSound) return 'record yourself reading aloud and compare with native speakers';
  for (const [pattern, tip] of Object.entries(PRACTICE_TIPS)) {
    if (firstSound.includes(pattern)) return tip;
  }
  return 'record yourself reading aloud and compare with native speakers';
};

export function StrengthsSection({ conciseStrengths }) {
  if (conciseStrengths.length === 0) return null;

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#e4e2f0] bg-white p-3.5 transition-all duration-200 hover:border-emerald-200/80 dark:border-white/[0.10] dark:bg-[#131515] sm:p-4">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf9f1] text-[#159669] border border-[#c4eee0]/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500/30">
            <TrendingUp className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
            Strengths
          </h3>
        </div>

        <div className="space-y-3">
          {conciseStrengths.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ImprovementsSection({ conciseImprovements }) {
  if (conciseImprovements.length === 0) return null;

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#e4e2f0] bg-white p-3.5 transition-all duration-200 hover:border-rose-200/80 dark:border-white/[0.10] dark:bg-[#131315] sm:p-4">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffeef3] text-[#e11d48] border border-[#fccedb]/60 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-500/30">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-extrabold tracking-tight text-rose-700 dark:text-rose-400">
            Areas to Improve
          </h3>
        </div>

        <div className="space-y-3">
          {conciseImprovements.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <div>
                {item.title && (
                  <p className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {item.title}
                  </p>
                )}
                <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">
                  {item.content || item}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudyRecommendationsSection() {
  const recommendations = [
    {
      title: 'Expand Vocabulary',
      description: 'Learn topic-specific vocabulary and practice using it in sentences.',
      buttonText: 'Practice Vocabulary',
      icon: BookOpen,
      color:
        'bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-[#131315] dark:border-white/[0.10]',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-white/[0.07] dark:text-blue-300',
      btnBorder:
        'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-white/[0.12] dark:text-blue-300',
    },
    {
      title: 'Develop Ideas',
      description: 'Give reasons, examples and explanations to extend your answers.',
      buttonText: 'See Example Answers',
      icon: Lightbulb,
      color:
        'bg-orange-50 text-orange-600 border-orange-200/80 dark:bg-[#131315] dark:border-white/[0.10]',
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-white/[0.07] dark:text-orange-300',
      btnBorder:
        'border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-white/[0.12] dark:text-orange-300',
    },
    {
      title: 'Improve Grammar',
      description: 'Focus on accurate sentence structures and variety in your responses.',
      buttonText: 'Grammar Guide',
      icon: Shapes,
      color:
        'bg-purple-50 text-purple-600 border-purple-200/80 dark:bg-[#131315] dark:border-white/[0.10]',
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-white/[0.07] dark:text-purple-300',
      btnBorder:
        'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-white/[0.12] dark:text-purple-300',
    },
    {
      title: 'Speak with Fluency',
      description: 'Practice speaking regularly to improve fluency and reduce hesitation.',
      buttonText: 'Fluency Exercises',
      icon: Activity,
      color:
        'bg-teal-50 text-teal-600 border-teal-200/80 dark:bg-[#131315] dark:border-white/[0.10]',
      iconBg: 'bg-teal-100 text-teal-600 dark:bg-white/[0.07] dark:text-teal-300',
      btnBorder:
        'border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-white/[0.12] dark:text-teal-300',
    },
  ];

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
        Study Recommendations
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={cn(
                'flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:shadow-sm dark:bg-[#131315]',
                item.color
              )}
            >
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      item.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                </div>
                <p className="mb-4 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 w-full justify-between rounded-xl px-3 text-[10px] font-bold shadow-none',
                  item.btnBorder
                )}
              >
                <span>{item.buttonText}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PronunciationBreakdownSection({ pronunciationBreakdown }) {
  if (!pronunciationBreakdown) return null;

  const { problematicSounds, wordIssues } = pronunciationBreakdown;
  const hasProblematicSounds = problematicSounds.length > 0;

  return (
    <div className="space-y-3 rounded-xl border border-[#e4e2f0] bg-white p-3.5 transition-all duration-200 hover:border-rose-200/80 dark:border-white/[0.10] dark:bg-[#131315] sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20">
          <Mic2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-xs font-extrabold uppercase tracking-[0.25em] text-rose-600 dark:text-rose-400">
          Pronunciation Breakdown
        </h3>
        <Badge
          variant="outline"
          className="ml-auto border-rose-500/30 text-[9px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400"
        >
          Enhanced Analysis
        </Badge>
      </div>

      {hasProblematicSounds && (
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
            Problematic Sounds
          </p>
          <div className="flex flex-wrap gap-2">
            {problematicSounds.map((sound, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 font-mono text-xs font-bold text-rose-600 transition-all hover:scale-105 dark:bg-rose-500/20 dark:text-rose-300"
              >
                {sound}
              </span>
            ))}
          </div>
        </div>
      )}

      {wordIssues.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
            Word-Level Issues
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {wordIssues.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-lg bg-rose-50/50 px-3 py-2 text-slate-800 dark:bg-rose-950/25 dark:text-zinc-200"
              >
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', getSeverityColor(item.severity))}
                />
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  &ldquo;{item.word}&rdquo;
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">{item.issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasProblematicSounds && (
        <div className="border-t border-rose-500/10 pt-3">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
            Practice Tip
          </p>
          <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
            Focus on minimal pairs to improve these sounds. For example,{' '}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {getPracticeTip(problematicSounds[0])}
            </span>
            . Repeat daily for best results.
          </p>
        </div>
      )}
    </div>
  );
}
