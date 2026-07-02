import React from 'react';
import { cn } from '@/lib/cn';
import { Mic2, CheckCircle2, Bot, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export function PronunciationBreakdownSection({ pronunciationBreakdown }) {
  if (!pronunciationBreakdown) return null;

  const { problematicSounds, wordIssues } = pronunciationBreakdown;
  const hasProblematicSounds = problematicSounds.length > 0;

  return (
    <div className="mt-4 p-5 bg-rose-500/[0.02] dark:bg-rose-950/20 border-2 border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] space-y-4">
      <div className="flex items-center gap-2">
        <Mic2 className="w-4 h-4 text-rose-500" />
        <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">
          Pronunciation Breakdown
        </h3>
        <Badge variant="outline" className="text-[8px] border-rose-500/30 text-rose-500 ml-auto">
          Enhanced Analysis
        </Badge>
      </div>

      {hasProblematicSounds && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-2">
            Problematic Sounds
          </p>
          <div className="flex flex-wrap gap-2">
            {problematicSounds.map((sound, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-lg text-xs font-mono font-bold border border-rose-500/20"
              >
                {sound}
              </span>
            ))}
          </div>
        </div>
      )}

      {wordIssues.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-2">
            Word-Level Issues
          </p>
          <div className="space-y-1.5">
            {wordIssues.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-rose-500/10 dark:border-rose-500/20"
              >
                <span
                  className={cn('w-2 h-2 rounded-full shrink-0', getSeverityColor(item.severity))}
                />
                <span className="text-xs font-bold text-foreground dark:text-zinc-100">
                  &ldquo;{item.word}&rdquo;
                </span>
                <span className="text-[11px] text-muted-foreground dark:text-zinc-400">
                  {item.issue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasProblematicSounds && (
        <div className="pt-2 border-t border-rose-500/10">
          <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-1.5">
            Practice Tip
          </p>
          <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed">
            Focus on minimal pairs to improve these sounds. For example,{' '}
            {getPracticeTip(problematicSounds[0])}. Repeat daily for best results.
          </p>
        </div>
      )}
    </div>
  );
}

export function StrengthsSection({ conciseStrengths }) {
  if (conciseStrengths.length === 0) return null;

  return (
    <div className="p-5 bg-emerald-500/[0.02] dark:bg-emerald-950/20 border-2 border-emerald-500/20 dark:border-emerald-500/30 rounded-[1.75rem] space-y-3 shadow-lg shadow-emerald-500/[0.02]">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Keep Doing</h3>
      </div>
      <div className="space-y-2">
        {conciseStrengths.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20 flex gap-3 items-start shadow-sm shadow-emerald-500/5"
          >
            <div className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-[13px] font-semibold dark:text-zinc-200 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImprovementsSection({ conciseImprovements }) {
  if (conciseImprovements.length === 0) return null;

  return (
    <div className="p-5 bg-rose-500/[0.02] dark:bg-rose-950/20 border-2 border-rose-500/20 dark:border-rose-500/30 rounded-[1.75rem] space-y-3 shadow-lg shadow-rose-500/[0.02]">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Fix Next</h3>
      </div>
      <div className="space-y-2">
        {conciseImprovements.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-rose-500/10 dark:border-rose-500/20 space-y-1 shadow-sm shadow-rose-500/5"
          >
            <h4 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
              {item.title}
            </h4>
            <p className="text-[13px] text-muted-foreground dark:text-zinc-300 font-medium leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TargetTipSection({ showTargetTip, conciseTargetTip }) {
  if (!showTargetTip) return null;

  return (
    <div className="bg-zinc-950 dark:bg-zinc-950 p-5 md:p-6 rounded-[1.5rem] text-white relative overflow-hidden border border-white/10 mt-6">
      <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-10">
        <Zap className="w-24 h-24" />
      </div>
      <div className="relative z-10 grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
        <div className="flex items-center gap-3 text-rose-500">
          <Bot className="w-5 h-5" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
            Next Score Move
          </h3>
        </div>
        <p className="text-sm md:text-base font-semibold leading-relaxed text-zinc-100">
          {conciseTargetTip}
        </p>
      </div>
    </div>
  );
}
