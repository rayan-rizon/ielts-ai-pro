import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import EmptyAnalyticsState from '../EmptyAnalyticsState';
import LockedFeature from './LockedFeature';
import CustomTooltip from './CustomTooltip';

export default function ProgressTrendCard({
  chartData,
  isPremium,
  activeTab,
  setActiveTab,
  tabs,
  onTabKeyDown,
  tabsRef,
}) {
  return (
    <Card className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
      <CardHeader className="px-4 pb-1 pt-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
              <Activity className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Your Progress Trend
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-slate-500 truncate">
                Watch your scores go up over time!
              </CardDescription>
            </div>
          </div>

          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Trend tabs"
            onKeyDown={onTabKeyDown}
            className="inline-flex gap-1 rounded-[14px] border border-[#d8dcfa] dark:border-white/10 bg-white/80 dark:bg-white/5 p-1 shrink-0 overflow-x-auto no-scrollbar"
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab;
              const label = tab === 'overview' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1);
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
                    'px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'bg-[#5661e9] text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <span>{label}</span>
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
        <LockedFeature isLocked={activeTab !== 'overview' && !isPremium} compact data-oid="31-iuua">
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
                    <linearGradient id="analyticsv2" x1="0" y1="0" x2="0" y2="1" data-oid="pvr5gwa">
                      <stop offset="0%" stopColor="#7157f5" stopOpacity={0.25} data-oid="thhzj5x" />

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

                  <Tooltip content={<CustomTooltip data-oid="1x7fb:j" />} data-oid="zatj-1d" />
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

                  <Tooltip content={<CustomTooltip data-oid="u4nxpar" />} data-oid="4s-p1tw" />
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
  );
}
