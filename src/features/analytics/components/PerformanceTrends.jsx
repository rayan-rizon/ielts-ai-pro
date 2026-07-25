import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Zap,
  Timer,
  AlertTriangle,
  Activity,
  Sparkles,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import EmptyAnalyticsState from './EmptyAnalyticsState';
import RecentPracticeHistory from './RecentPracticeHistory';

// --- SUB-COMPONENTS ---

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload?.[0]?.value;
  return (
    <div
      className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl border-opacity-50 min-w-[140px]"
      data-oid="qdrn1w5"
    >
      <div className="text-sm font-black text-primary tracking-[0.2em] mb-1" data-oid="05wp2d7">
        {label}
      </div>
      <div className="flex items-baseline gap-1" data-oid=":880-cr">
        <span className="text-xl font-black text-foreground dark:text-white" data-oid="dgefpjn">
          {formatBand(val)}
        </span>
        <span className="text-sm font-bold text-muted-foreground/90" data-oid="wfhq1l6">
          Score
        </span>
      </div>
    </div>
  );
}

const UniversalRadar = React.memo(function UniversalRadar({ data, name, color = 'primary' }) {
  const hasData = data && data.length > 0;

  return (
    <div className="h-full w-full group/radar relative" data-oid="t0z754t">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10" data-oid="rs:jonf">
          <Badge
            className="bg-background/90 backdrop-blur-md border border-primary/20 text-[10px] font-black tracking-widest text-muted-foreground px-3 py-1 rounded-full shadow-xl uppercase"
            data-oid="5wl8q_3"
          >
            Awaiting Test Results
          </Badge>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%" data-oid="zvgf8rl">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="72%"
          margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
          data={
            hasData
              ? data
              : [
                  { subject: 'Reading', A: 0 },
                  { subject: 'Writing', A: 0 },
                  { subject: 'Listening', A: 0 },
                  { subject: 'Speaking', A: 0 },
                ]
          }
          className={cn(
            'transition-all duration-1000',
            !hasData && 'opacity-20 grayscale blur-[2px]'
          )}
          data-oid="t_kyv25"
        >
          <defs data-oid="6-.jt-:">
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1" data-oid="zr1lx3h">
              <stop
                offset="5%"
                stopColor={`hsl(var(--${color}))`}
                stopOpacity={0.6}
                data-oid="bfxqww5"
              />

              <stop
                offset="95%"
                stopColor={`hsl(var(--${color}))`}
                stopOpacity={0.1}
                data-oid="1qrlf82"
              />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" opacity={0.8} data-oid=":ii.j3k" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'hsl(var(--foreground))',
              fontSize: 10,
              fontWeight: 800,
              opacity: 0.9,
            }}
            data-oid=":3wln1i"
          />

          <PolarRadiusAxis
            angle={30}
            domain={[0, 9]}
            tick={false}
            axisLine={false}
            data-oid="misbqjk"
          />

          {hasData && (
            <Radar
              name={name}
              dataKey="A"
              stroke={`hsl(var(--${color}))`}
              fill="url(#radarGradient)"
              fillOpacity={1}
              strokeWidth={3}
              dot={{
                r: 3,
                fill: `hsl(var(--${color}))`,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              className="transition-all duration-500 hover:fill-opacity-80"
              animationBegin={0}
              animationDuration={1500}
              data-oid="m8bcq-0"
            />
          )}
          {hasData && <Tooltip content={<CustomTooltip data-oid="ctzx0i0" />} data-oid="pl-riae" />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

function getQuestionSuccessSummary(data = []) {
  const totals = data.reduce(
    (summary, item) => ({
      correct: summary.correct + (Number(item.correct) || 0),
      total: summary.total + (Number(item.total) || 0),
    }),
    { correct: 0, total: 0 }
  );

  return {
    ...totals,
    accuracy: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
  };
}

function questionSuccessTone(accuracy) {
  if (accuracy >= 70) {
    return {
      label: 'Strong',
      accent: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (accuracy >= 50) {
    return {
      label: 'Developing',
      accent: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }
  return {
    label: 'Focus next',
    accent: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };
}

const QuestionTypeTable = React.memo(function QuestionTypeTable({ data }) {
  if (!data || !data.length)
    return (
      <EmptyAnalyticsState
        icon={Target}
        title="Accuracy Breakdown"
        description="Submit tests with feedback to see your precision breakdown across question types."
        compact
        data-oid="hzugqsx"
      />
    );

  const summary = getQuestionSuccessSummary(data);

  return (
    <div className="space-y-2 pt-1" data-oid="t9.c66m">
      <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/50 p-2.5 dark:border-violet-500/15 dark:bg-violet-500/5">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Weighted accuracy
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {summary.correct} correct from {summary.total} graded questions
          </p>
        </div>
        <p className="text-xl font-black text-violet-600 dark:text-violet-400">
          {summary.accuracy}%
        </p>
      </div>
      {data.map((item, idx) => (
        <motion.article
          key={idx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-all hover:border-violet-200/80 hover:shadow-xs dark:border-white/5 dark:bg-white/[0.03]"
          data-oid="qpfmnea"
        >
          {(() => {
            const tone = questionSuccessTone(item.accuracy);
            return (
              <>
                <div className="flex items-center justify-between gap-2" data-oid="d:oa..r">
                  <div className="flex items-center gap-2 min-w-0" data-oid="::ydhmk">
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', tone.accent)}
                      data-oid="ozi547e"
                    />
                    <span
                      className="text-xs font-black text-slate-900 dark:text-white truncate"
                      data-oid="32-hpvy"
                    >
                      {item.type
                        .split(/_|\s+/)
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" data-oid="2-:-ndm">
                    <span className={cn('text-xs font-black', tone.text)}>{item.accuracy}%</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase',
                        tone.badge
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  data-oid="pwl9tjb"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    className={cn('h-full rounded-full transition-all duration-1000', tone.accent)}
                    data-oid="vdpsru:"
                  />
                </div>

                <div
                  className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400"
                  data-oid="f7d3yd2"
                >
                  <span>Correct answers</span>
                  <span data-oid="u5q:igr">
                    <strong className="text-slate-800 dark:text-slate-200" data-oid="67cswiw">
                      {item.correct}
                    </strong>{' '}
                    of {item.total}
                  </span>
                </div>
              </>
            );
          })()}
        </motion.article>
      ))}
    </div>
  );
});

const LockedFeature = React.memo(function LockedFeature({
  isLocked,
  children,
  className,
  compact = false,
}) {
  if (!isLocked) return children;

  return (
    <div
      className={cn('relative group/locked h-full overflow-hidden', className)}
      data-oid="ks:eu.o"
    >
      <div
        className="blur-[12px] select-none pointer-events-none opacity-25 transition-all duration-700 scale-[0.98]"
        data-oid="-8_:k6d"
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
        data-oid="ukiqp7l"
      >
        <div
          className={cn(
            'w-full rounded-[2rem] border border-amber-500/30 bg-card p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] transform group-hover/locked:scale-[1.01] transition-all duration-500 ring-1 ring-white/10',
            compact ? 'max-w-[280px] p-4 sm:p-5' : 'max-w-[340px]'
          )}
          data-oid="i5mz2xi"
        >
          <div className="flex flex-col items-center text-center gap-4" data-oid="do5kko:">
            {!compact && (
              <div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/40 group-hover/locked:rotate-6 transition-transform duration-500"
                data-oid="9gty6zb"
              >
                <Zap className="w-7 h-7 fill-white/20" data-oid="csyu73." />
              </div>
            )}

            <div className={cn('space-y-1.5', compact ? 'text-sm' : '')} data-oid="82z7t_n">
              <div
                className={cn(
                  'font-black text-foreground tracking-tight underline decoration-amber-500/30 decoration-4 underline-offset-4',
                  compact ? 'text-lg' : 'text-xl'
                )}
                data-oid="i3-bqsx"
              >
                Unlock Pro Insights
              </div>
              <p
                className="text-sm font-bold text-muted-foreground/80 leading-relaxed max-w-[240px]"
                data-oid="xxx_xou"
              >
                Gain access to detailed progress patterns and hit your{' '}
                <span
                  className="text-amber-600 dark:text-amber-400 font-black italic"
                  data-oid="pdsmy9k"
                >
                  9.0 Band
                </span>{' '}
                goal faster.
              </p>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-black text-xs tracking-widest rounded-xl shadow-lg shadow-amber-500/25 h-10 group/btn"
              data-oid="-c9-t9y"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>

            {!compact && (
              <div className="pt-2 flex flex-col items-center gap-2" data-oid="social">
                <div className="flex -space-x-2" data-oid="avatars">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar
                      key={i}
                      className="w-6 h-6 border-2 border-background ring-1 ring-amber-500/10"
                      data-oid={`av-${i}`}
                    >
                      <AvatarImage src={`https://i.pravatar.cc/100?u=${i + 10}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-background text-xs font-black text-amber-600 ring-1 ring-amber-500/10">
                    +2k
                  </div>
                </div>
                <span className="text-xs font-black text-muted-foreground tracking-widest">
                  Join 2,500+ successful students
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// --- MAIN COMPONENT ---

export default function PerformanceTrends({
  stats,
  radarData,
  chartData,
  isPremium,
  activeTab,
  setActiveTab,
  tabs,
  onTabKeyDown,
  tabsRef,
  user,
}) {
  if (!stats || !chartData) return null;
  const questionSuccessSummary = getQuestionSuccessSummary(stats.typeAccuracy);

  return (
    <div className="space-y-6 lg:space-y-8" data-oid="ez4903f">
      {/* Side-by-side Progress Trend & Recent Practice History */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="7-3vqly">
            <Card
              className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950"
              data-oid="qr-cduw"
            >
              <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5" data-oid="-j_:j6k">
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  data-oid="snpr6cr"
                >
                  <div className="flex items-center gap-2.5 min-w-0" data-oid="lg4-e5-">
                    <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Activity className="h-3.5 w-3.5" data-oid="b3s4yyp" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle
                        className="text-base font-black tracking-tight text-slate-950 dark:text-white"
                        data-oid="vjxe3b3"
                      >
                        Your Progress Trend
                      </CardTitle>
                      <CardDescription
                        className="text-[11px] font-medium text-slate-500 truncate"
                        data-oid="950965g"
                      >
                        Watch your scores go up over time!
                      </CardDescription>
                    </div>
                  </div>

                  <div
                    ref={tabsRef}
                    role="tablist"
                    aria-label="Trend tabs"
                    onKeyDown={onTabKeyDown}
                    className="inline-flex gap-1 rounded-xl border border-slate-100 bg-slate-50/70 p-1 dark:border-white/5 dark:bg-white/[0.03]"
                    data-oid="sn.ize2"
                  >
                    {tabs.map((tab) => {
                      const isSelected = activeTab === tab;
                      const label =
                        tab === 'overview' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1);
                      return (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          data-tab={tab}
                          aria-selected={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-black rounded-lg transition-all relative overflow-hidden',
                            isSelected
                              ? 'bg-white shadow-2xs text-indigo-600 dark:bg-slate-900 dark:text-indigo-400'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          )}
                          data-oid="18x.yt_"
                        >
                          <span className="relative z-10" data-oid="8dcv0pi">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5"
                data-oid="gqgf00s"
              >
                <LockedFeature
                  isLocked={activeTab !== 'overview' && !isPremium}
                  compact
                  data-oid="31-iuua"
                >
                  <div className="h-[210px] sm:h-[225px] w-full relative" data-oid="k0v7.3h">
                    {activeTab === 'overview' && !chartData.history?.length && (
                      <div
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                        data-oid="p4cm953"
                      >
                        <div
                          className="flex flex-col items-center animate-in fade-in zoom-in duration-700"
                          data-oid="4.4gnw2"
                        >
                          <div
                            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2"
                            data-oid="bb_mzuy"
                          >
                            <TrendingUp className="w-5 h-5 text-primary/40" data-oid="31ulcz3" />
                          </div>
                          <p
                            className="text-[11px] font-black text-muted-foreground tracking-widest text-center max-w-[150px]"
                            data-oid="o4dgu4p"
                          >
                            Analyzing First Session...
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab !== 'overview' &&
                      (!chartData.moduleHistory[activeTab] ||
                        chartData.moduleHistory[activeTab].length === 0) && (
                        <div
                          className="absolute inset-0 flex items-center justify-center z-10"
                          data-oid="pnpy6cs"
                        >
                          <EmptyAnalyticsState
                            icon={Activity}
                            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics`}
                            description={`Complete more ${activeTab} tests to unlock detailed performance trends.`}
                            compact
                            data-oid="8-pio3_"
                          />
                        </div>
                      )}

                    <ResponsiveContainer width="100%" height="100%" data-oid="io4vrd6">
                      {activeTab === 'overview' ? (
                        <AreaChart
                          data={chartData.history?.length ? chartData.history : []}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          className={cn(
                            'transition-all duration-1000',
                            !chartData.history?.length && 'opacity-[0.08] grayscale blur-[3px]'
                          )}
                          data-oid="73pywcp"
                        >
                          <defs data-oid="rw4l3px">
                            <linearGradient
                              id="analyticsv2"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                              data-oid="pvr5gwa"
                            >
                              <stop
                                offset="0%"
                                stopColor="#7157f5"
                                stopOpacity={0.25}
                                data-oid="thhzj5x"
                              />

                              <stop
                                offset="100%"
                                stopColor="#7157f5"
                                stopOpacity={0.02}
                                data-oid="q.qa.ya"
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                            opacity={0.5}
                            data-oid="d5.t..y"
                          />

                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            dy={5}
                            minTickGap={30}
                            interval="preserveStartEnd"
                            data-oid="7xykue7"
                          />

                          <YAxis
                            domain={[0, 9]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            width={24}
                            data-oid="-d2.ni0"
                          />

                          <Tooltip
                            content={<CustomTooltip data-oid="1x7fb:j" />}
                            data-oid="zatj-1d"
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#7157f5"
                            strokeWidth={3}
                            fill="url(#analyticsv2)"
                            dot={{ r: 3, strokeWidth: 2, fill: '#7157f5' }}
                            activeDot={{
                              r: 5,
                              fill: '#7157f5',
                              strokeWidth: 2,
                              stroke: '#fff',
                            }}
                            data-oid=":9lhx66"
                          />
                        </AreaChart>
                      ) : (
                        <LineChart
                          data={
                            chartData.moduleHistory[activeTab] &&
                            chartData.moduleHistory[activeTab].length > 0
                              ? chartData.moduleHistory[activeTab]
                              : []
                          }
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          className={cn(
                            'transition-all duration-1000',
                            (!chartData.moduleHistory[activeTab] ||
                              chartData.moduleHistory[activeTab].length === 0) &&
                              'opacity-[0.05] grayscale blur-[2px]'
                          )}
                          data-oid="o8hfc4s"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                            opacity={0.5}
                            data-oid="me3hq_5"
                          />

                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            dy={5}
                            minTickGap={30}
                            interval="preserveStartEnd"
                            data-oid="pr.5hz6"
                          />

                          <YAxis
                            domain={[0, 9]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            width={24}
                            data-oid="8t2-drm"
                          />

                          <Tooltip
                            content={<CustomTooltip data-oid="u4nxpar" />}
                            data-oid="4s-p1tw"
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#7157f5"
                            strokeWidth={3}
                            dot={{ r: 3, strokeWidth: 2, fill: '#7157f5' }}
                            activeDot={{ r: 5, fill: '#7157f5' }}
                            data-oid="n942r-g"
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </LockedFeature>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <RecentPracticeHistory sessions={chartData.recentPractice || []} user={user} />
        </div>
      </div>

      <motion.div variants={ITEM_VARIANTS} data-oid="1atf515">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6" data-oid="pj.2q8p">
          {/* Module Mastery Radar */}
          <Card
            className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950"
            data-oid="obrjoof"
          >
            <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5" data-oid="hc-wu6j">
              <div className="flex items-center justify-between gap-3" data-oid="k2m.wh0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <TrendingUp className="h-3.5 w-3.5" data-oid="y6qo3w4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle
                      className="text-base font-black tracking-tight text-slate-950 dark:text-white"
                      data-oid="kihiso_"
                    >
                      Module Mastery
                    </CardTitle>
                    <CardDescription
                      className="text-[11px] font-medium text-slate-500 truncate"
                      data-oid="1-4yxra"
                    >
                      Your performance envelope across IELTS modules.
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-200 bg-slate-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                  data-oid="fb9l6zn"
                >
                  Balance
                </Badge>
              </div>
            </CardHeader>
            <CardContent
              className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5 sm:flex-row items-center gap-3"
              data-oid="pu2nhj."
            >
              <div className="w-full sm:w-[55%] h-[180px] sm:h-full" data-oid="kbauega">
                <UniversalRadar
                  data={radarData}
                  name="Band Performance"
                  color="primary"
                  data-oid="xo.ihj_"
                />
              </div>
              <div className="w-full sm:w-[45%] space-y-2.5 pr-1" data-oid="cti0:18">
                {radarData.map((item, idx) => {
                  const moduleColorMap = {
                    Reading: '#22a866',
                    Writing: '#4f7df3',
                    Listening: '#f5a742',
                    Speaking: '#b85ed1',
                  };
                  const color = moduleColorMap[item.subject] || '#7157f5';
                  return (
                    <motion.div
                      key={item.subject}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="space-y-1"
                      data-oid="tu7:jja"
                    >
                      <div className="flex items-center justify-between px-0.5" data-oid="wz._gze">
                        <span
                          className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight"
                          data-oid="ra-rsiz"
                        >
                          {item.subject}
                        </span>
                        <span
                          className="text-xs font-black text-slate-950 dark:text-white"
                          data-oid="udpv-nu"
                        >
                          {formatBand(item.A)}
                        </span>
                      </div>
                      <div
                        className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800"
                        data-oid="1s61xdz"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.A / 9) * 100}%` }}
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ backgroundColor: color }}
                          data-oid="gta556f"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Question Types */}
          <Card
            className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950"
            data-oid="3bnrh6g"
          >
            <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5" data-oid="n9word6">
              <div className="flex items-center justify-between gap-3" data-oid="7nzhlcl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Target className="h-3.5 w-3.5" data-oid="uxibci1" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle
                      className="text-base font-black tracking-tight text-slate-950 dark:text-white"
                      data-oid="::shik2"
                    >
                      Question Success Rate
                    </CardTitle>
                    <CardDescription
                      className="text-[11px] font-medium text-slate-500 truncate"
                      data-oid="c2x3g-r"
                    >
                      Weighted accuracy across completed questions.
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  data-oid="9:3a._o"
                >
                  {questionSuccessSummary.total
                    ? `${questionSuccessSummary.accuracy}% overall`
                    : 'No data'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent
              className="flex-1 overflow-y-auto px-3.5 pb-3.5 pt-1 sm:px-4.5 scrollbar-thin scrollbar-thumb-muted"
              data-oid="huwghdg"
            >
              <QuestionTypeTable data={stats.typeAccuracy} data-oid="uv1t-vc" />
            </CardContent>
          </Card>

          {/* Deep Insights (Pro) */}
          <Card
            className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950"
            data-oid="u_amfu5"
          >
            <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5" data-oid="-4_zzio">
              <div className="flex items-center justify-between gap-3" data-oid="qub627-">
                <div className="flex items-center gap-2.5 min-w-0" data-oid="8y3-bj0">
                  <div
                    className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                    data-oid="w5:00go"
                  >
                    <Zap className="h-3.5 w-3.5" data-oid="gjwp5w4" />
                  </div>
                  <div className="min-w-0" data-oid="7tzifoi">
                    <CardTitle
                      className="text-base font-black tracking-tight text-slate-950 dark:text-white"
                      data-oid="e2-32.."
                    >
                      Smart Feedback
                    </CardTitle>
                    <CardDescription
                      className="text-[11px] font-medium text-slate-500 truncate"
                      data-oid="m_l7ys7"
                    >
                      Personalized tips for you
                    </CardDescription>
                  </div>
                </div>
                {!isPremium && (
                  <Badge
                    className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                    data-oid="r6a_lzr"
                  >
                    Pro Feature
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative" data-oid="8twiya3">
              <LockedFeature isLocked={!isPremium} compact className="h-full" data-oid="4u8r4z1">
                <div
                  className="px-3.5 pb-3 pt-1 sm:px-4.5 space-y-2.5 overflow-y-auto h-full scrollbar-thin"
                  data-oid="inner-content"
                >
                  {stats.enhancedMetrics.hasData ? (
                    <>
                      <div className="grid grid-cols-3 gap-1.5" data-oid="-lufzwo">
                        <StatMiniCard
                          icon={Timer}
                          label="Avg Time"
                          value={`${stats.enhancedMetrics.avgTimePerSession}m`}
                          data-oid="dgo-bc1"
                        />

                        <StatMiniCard
                          icon={Zap}
                          label="Too Fast"
                          value={stats.enhancedMetrics.totalRushed}
                          alert={stats.enhancedMetrics.totalRushed > 5}
                          alertColor="amber"
                          data-oid="3iltfcq"
                        />

                        <StatMiniCard
                          icon={AlertTriangle}
                          label="Too Slow"
                          value={stats.enhancedMetrics.totalOveranalyzed}
                          alert={stats.enhancedMetrics.totalOveranalyzed > 5}
                          alertColor="rose"
                          data-oid="rry8.95"
                        />
                      </div>

                      {stats.enhancedMetrics.skillGaps.length > 0 && (
                        <div className="space-y-1.5" data-oid="ms_lc-0">
                          <SectionHeading
                            icon={Target}
                            label="Skills to Work On"
                            subLabel="Priority"
                            data-oid="5gk2v.7"
                          />

                          <div className="space-y-1.5" data-oid="amgi65c">
                            {stats.enhancedMetrics.skillGaps.slice(0, 3).map((sg) => (
                              <SkillGapItem
                                key={sg.skill}
                                skill={sg.skill}
                                avg={sg.avg}
                                data-oid="vt16-si"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {stats.enhancedMetrics.topTroubleTypes.length > 0 && (
                        <div className="space-y-1.5 pt-0.5" data-oid="kwphww6">
                          <SectionHeading
                            icon={Sparkles}
                            label="Focus Areas"
                            color="text-indigo-600 dark:text-indigo-400"
                            data-oid="syzg9fg"
                          />

                          <div className="flex flex-wrap gap-1.5" data-oid="ovu97pz">
                            {stats.enhancedMetrics.topTroubleTypes.map((type) => (
                              <TroubleTag key={type} type={type} data-oid="oh6it06" />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyAnalyticsState
                      icon={Gauge}
                      title="Analysis Pending"
                      description="Complete tests to generate your personalized Deep Insights and performance audits."
                      compact
                      data-oid="0e1mw:5"
                    />
                  )}
                </div>
              </LockedFeature>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

// --- SHARED UI HELPERS ---

function StatMiniCard({ icon: Icon, label, value, alert, alertColor }) {
  const colorStyles = alert
    ? alertColor === 'rose'
      ? 'bg-rose-50/70 border-rose-200/80 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
      : 'bg-amber-50/70 border-amber-200/80 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
    : 'bg-slate-50/70 border-slate-200/70 text-slate-700 dark:bg-white/[0.03] dark:border-white/5 dark:text-slate-300';

  const iconColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-500 dark:text-rose-400'
      : 'text-amber-500 dark:text-amber-400'
    : 'text-indigo-500 dark:text-indigo-400';

  const labelColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-600/80 dark:text-rose-400/80'
      : 'text-amber-600/80 dark:text-amber-400/80'
    : 'text-slate-400 dark:text-slate-400';

  const valueColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-amber-600 dark:text-amber-400'
    : 'text-slate-950 dark:text-white';

  return (
    <div
      className={cn(
        'p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all h-[56px]',
        colorStyles
      )}
      data-oid="iykydqu"
    >
      <div className="flex items-center gap-1" data-oid="qvxcv1p-wrap">
        <Icon className={cn('w-3 h-3', iconColor)} data-oid="qvxcv1p" />
        <span
          className={cn('text-[9px] font-extrabold uppercase tracking-wider truncate', labelColor)}
          data-oid="m2xsq81"
        >
          {label}
        </span>
      </div>
      <span className={cn('text-xs font-black truncate mt-0.5', valueColor)} data-oid="v8i5nvv">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ icon: Icon, label, subLabel, color }) {
  return (
    <div className="flex items-center justify-between px-0.5" data-oid="4-fb8tb">
      <span
        className={cn(
          'text-xs font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5',
          color
        )}
        data-oid="xp9yc9d"
      >
        <Icon className="w-3.5 h-3.5 text-indigo-500" data-oid="qrnu9el" /> {label}
      </span>
      {subLabel && (
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"
          data-oid="c070qju"
        >
          {subLabel}
        </span>
      )}
    </div>
  );
}

function SkillGapItem({ skill, avg }) {
  const isHighRisk = avg < 40;
  const isMediumRisk = avg >= 40 && avg < 70;
  return (
    <div
      className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/40 p-2 dark:border-white/5 dark:bg-white/[0.02]"
      data-oid="bmdkccl"
    >
      <div className="flex justify-between items-center text-xs" data-oid="2aleqd_">
        <span
          className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate"
          data-oid="9xf0ipf"
        >
          {skill}
        </span>
        <span
          className={cn(
            'font-black text-[9.5px] uppercase px-1.5 py-0.5 rounded-full border',
            isHighRisk
              ? 'bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
              : isMediumRisk
                ? 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
          )}
          data-oid="my7m1nk"
        >
          {avg}%
        </span>
      </div>
      <div
        className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
        data-oid="emij1sn"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(avg, 4)}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            isHighRisk ? 'bg-rose-500' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          data-oid="5t6bmjl"
        />
      </div>
    </div>
  );
}

function TroubleTag({ type }) {
  return (
    <div
      className="px-2.5 py-1 rounded-lg bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 flex items-center gap-1.5 transition-all cursor-default"
      data-oid="5ng.5bc"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" data-oid="nwl26h4" />
      <span
        className="text-[10.5px] font-extrabold text-rose-700 dark:text-rose-300 capitalize tracking-tight"
        data-oid="gr0rke."
      >
        {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    </div>
  );
}
