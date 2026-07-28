import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, PieChart as PieIcon, Sparkles } from 'lucide-react';
import { ITEM_VARIANTS } from '../constants';
import EmptyAnalyticsState from './EmptyAnalyticsState';
import { cn } from '@/lib/cn';

const MISTAKE_COLORS = {
  'Almost Correct': '#5661e9',
  'Left Blank': '#f43f5e',
  Rushing: '#f59e0b',
  'Thinking Too Long': '#a855f7',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = MISTAKE_COLORS[data.name] || data.color || '#5661e9';
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/95 px-3 py-1.5 shadow-2xl backdrop-blur-md">
        <span
          className="h-2 w-2 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-extrabold text-slate-300">{data.name}:</span>
        <span className="text-xs font-black text-white">
          {data.value} {data.value === 1 ? 'mistake' : 'mistakes'}
        </span>
      </div>
    );
  }
  return null;
};

export default function ErrorAudit({ data, sessionReferences = {}, onDrilldown }) {
  const hasData = data && data.length > 0;
  const totalPointsLost = hasData ? data.reduce((sum, d) => sum + d.value, 0) : 0;

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
    <motion.div variants={ITEM_VARIANTS} className="h-full w-full">
      <Card className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
        <CardHeader className="px-4 pb-2 pt-4 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
                <AlertCircle className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                  Answer Analysis
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-400 truncate">
                  See why you missed marks
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-0 bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider"
            >
              Interactive
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between px-3.5 pb-3.5 pt-2 sm:px-4.5 overflow-y-auto scrollbar-thin space-y-2.5">
          {hasData ? (
            <>
              <div className="h-[120px] relative shrink-0">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-950 dark:text-white leading-none">
                    {totalPointsLost}
                  </span>
                  <span className="mt-0.5 text-[9px] font-black uppercase text-[#5661e9] dark:text-indigo-300 tracking-wider">
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
                      {data.map((entry, index) => {
                        const cellColor = MISTAKE_COLORS[entry.name] || entry.color || '#5661e9';
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={cellColor}
                            className="hover:opacity-80 transition-opacity outline-none"
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                      offset={12}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {getSmartDescription() && (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-[#f5f4ff] p-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/40 shrink-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    {getSmartDescription()}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 shrink-0">
                {data.map((item) => {
                  const itemColor = MISTAKE_COLORS[item.name] || item.color || '#5661e9';
                  const isLeftBlank = item.name === 'Left Blank';
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleCellClick(item)}
                      className="group flex h-10 items-center justify-between gap-2 rounded-xl border border-indigo-100/80 bg-[#faf9ff] px-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs dark:border-white/10 dark:bg-slate-900/80 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: itemColor }}
                        />
                        <span className="truncate text-xs font-black text-slate-950 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black',
                          isLeftBlank
                            ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-200/70'
                            : 'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20'
                        )}
                      >
                        {item.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyAnalyticsState
              icon={PieIcon}
              title="Mistake Tracking"
              description="Keep practicing to see a breakdown of your mistakes."
              compact
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
