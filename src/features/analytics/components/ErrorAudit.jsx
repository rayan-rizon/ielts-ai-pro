import React from 'react';
import { m } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, Sparkles } from 'lucide-react';
import { ITEM_VARIANTS } from '../constants';
import { cn } from '@/lib/cn';
import {
  AnimatedNumber,
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  TILE,
  Tip,
} from '@/features/dashboard/components/primitives';

// No pure red here — "Left Blank" used to be alarm-rose, and since IELTS has no
// negative marking it isn't a failure, just a habit worth noticing. When it's
// the only mistake type present the whole ring used to render solid red, which
// read as far more alarming than the data actually is.
const MISTAKE_COLORS = {
  'Almost Correct': '#5a63df',
  'Left Blank': '#d97706',
  Rushing: '#0284c7',
  'Thinking Too Long': '#059669',
};

// The four category names are jargon on first read — a tooltip carries the
// exact rule behind each one, since "Rushing" alone doesn't say the cutoff is
// 20 seconds.
const MISTAKE_EXPLANATIONS = {
  'Almost Correct': 'Selected an answer one option away from correct — a near miss, not a guess.',
  'Left Blank': 'No answer submitted. IELTS has no negative marking, so this is pure lost marks.',
  Rushing: 'Answered in under 20 seconds — often a snap choice before reading fully.',
  'Thinking Too Long': 'Spent over 2.5 minutes on one question — a sign of second-guessing.',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const color = MISTAKE_COLORS[data.name] || data.color || '#5a63df';
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 shadow-lg dark:border-white/10 dark:bg-[#1b1a22]">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{data.name}:</span>
      <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
        {data.value} {data.value === 1 ? 'mistake' : 'mistakes'}
      </span>
    </div>
  );
};

/**
 * Why marks were missed, and whether second-guessing helps this learner.
 *
 * The rushed / over-thought counts used to be printed as pills on a separate
 * "practice habits" card as well as being two of the four segments in this
 * ring. They live here only. The revision edge — the one signal that card
 * carried alone — rides in the footnote, because it answers the same question
 * the ring does: what to change about how answers get given.
 */
export default function ErrorAudit({
  data,
  sessionReferences = {},
  onDrilldown,
  behaviour,
  totalMistakes,
}) {
  const hasData = data && data.length > 0;
  const edge = behaviour?.hasSignal ? behaviour.revisionEdge : null;
  // A wrong answer can be both a near miss and a timing error; the headline
  // counts each question once when the analytics model supplies that total.
  const categorySum = hasData ? data.reduce((sum, d) => sum + d.value, 0) : 0;
  const totalPointsLost = hasData
    ? Number.isFinite(totalMistakes)
      ? Math.min(categorySum, totalMistakes)
      : categorySum
    : 0;

  const handleCellClick = (entry) => {
    const categoryMap = {
      'Almost Correct': 'nearMisses',
      Rushing: 'rushed',
      'Thinking Too Long': 'overanalyzed',
      'Left Blank': 'unanswered',
    };

    const key = categoryMap[entry.name];
    if (key && sessionReferences[key] && onDrilldown) {
      onDrilldown(key, sessionReferences[key]);
    }
  };

  const getSmartDescription = () => {
    if (!hasData) return null;
    const rushed = data.find((d) => d.name === 'Rushing')?.value || 0;
    const overanalyzed = data.find((d) => d.name === 'Thinking Too Long')?.value || 0;
    const unanswered = data.find((d) => d.name === 'Left Blank')?.value || 0;

    if (unanswered > totalPointsLost * 0.3) {
      return 'Always pick an answer! No negative marks in IELTS.';
    }
    if (rushed > overanalyzed * 2) {
      return 'Slowing down a little will boost your band score.';
    }
    if (overanalyzed > rushed * 2) {
      return 'Trust your first choice to save precious time.';
    }
    return 'Focus on your most frequent mistake types.';
  };

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full w-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Answer analysis"
          tip="Why you missed marks — tap a category to see the exact questions."
        />

        {hasData ? (
          // `justify-between` here spread the three blocks to the card's full
          // height, so whenever a neighbour in the row was taller this card
          // grew two arbitrary voids. Extra height now goes to the ring, which
          // stays centred in whatever space it gets; advice and legend stay
          // packed together at the bottom.
          <div className="flex flex-1 flex-col gap-3">
            <div className="relative min-h-[130px] flex-1">
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    NUM,
                    'text-2xl font-extrabold leading-none text-slate-900 dark:text-white'
                  )}
                >
                  <AnimatedNumber value={totalPointsLost} decimals={0} />
                </span>
                <span className={cn(MICRO, 'mt-0.5 text-[#5a63df] dark:text-[#a9afff]')}>
                  Mistakes
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    onClick={handleCellClick}
                    className="cursor-pointer"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MISTAKE_COLORS[entry.name] || entry.color || '#5a63df'}
                        className="outline-none transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 100 }} offset={12} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {getSmartDescription() && (
              <div className={cn(TILE, 'flex shrink-0 items-center gap-2 p-2.5')}>
                <IconChip icon={Sparkles} tone="accent" size="sm" />
                <p className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-300">
                  {getSmartDescription()}
                </p>
              </div>
            )}

            <div className="grid shrink-0 grid-cols-2 gap-2">
              {data.map((item) => {
                const itemColor = MISTAKE_COLORS[item.name] || item.color || '#5a63df';
                return (
                  <Tip key={item.name} content={MISTAKE_EXPLANATIONS[item.name] || item.name}>
                    <button
                      type="button"
                      onClick={() => handleCellClick(item)}
                      className={cn(
                        TILE,
                        'flex h-9 items-center justify-between gap-2 px-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: itemColor }}
                        />
                        <span className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          NUM,
                          'shrink-0 text-xs font-extrabold text-slate-900 dark:text-white'
                        )}
                      >
                        <AnimatedNumber value={item.value} decimals={0} />
                      </span>
                    </button>
                  </Tip>
                );
              })}
            </div>
          </div>
        ) : (
          <Empty icon={PieIcon} className="flex-1 content-center">
            Complete a graded test to see a breakdown of your mistakes.
          </Empty>
        )}

        <PanelFootnote>
          {edge != null ? (
            <>
              Changing an answer is worth{' '}
              <span
                className={cn(
                  NUM,
                  'font-bold',
                  edge >= 0 ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-fault))]'
                )}
              >
                {edge > 0 ? '+' : ''}
                <AnimatedNumber value={edge} decimals={0} />
              </span>{' '}
              points of accuracy for you.
            </>
          ) : (
            <span className={MUTED}>Select a segment to see the exact questions behind it.</span>
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
