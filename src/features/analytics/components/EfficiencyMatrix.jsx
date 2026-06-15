import React from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Activity } from 'lucide-react';
import { ITEM_VARIANTS } from '../constants';
import EmptyAnalyticsState from './EmptyAnalyticsState';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-2xl"
        data-oid="zywdqbk"
      >
        <div className="flex items-center gap-2 mb-2" data-oid="axs_q7f">
          <Badge
            className="bg-primary/10 text-primary border-0 text-[10px] font-black tracking-tight"
            data-oid="x7f_179"
          >
            {data.type}
          </Badge>
          <span className="text-[10px] font-black text-muted-foreground" data-oid="-x43ilw">
            Session
          </span>
        </div>
        <div className="space-y-1.5" data-oid="142xude">
          <div className="flex justify-between items-center gap-4" data-oid="ago88xp">
            <span className="text-[10px] font-bold text-muted-foreground" data-oid="wz:i4.k">
              Accuracy
            </span>
            <span className="text-xs font-black text-foreground" data-oid="1s9m9sf">
              {data.accuracy}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-4" data-oid=".8oyay4">
            <span className="text-[10px] font-bold text-rose-500" data-oid="mkk.v-q">
              Quick Responses
            </span>
            <span className="text-xs font-black text-rose-500" data-oid="prmxgfn">
              {data.rushed} Qs
            </span>
          </div>
          <div className="flex justify-between items-center gap-4" data-oid="bdlk1uw">
            <span className="text-[10px] font-bold text-amber-500" data-oid="jwo7vit">
              Carefully Answered
            </span>
            <span className="text-xs font-black text-amber-500" data-oid="00:wxh9">
              {data.overanalyzed} Qs
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/10" data-oid="nqy9ozj">
          <p
            className="text-[9px] italic font-medium text-indigo-500 dark:text-indigo-400 leading-tight"
            data-oid="60.oumd"
          >
            {data.rushed > data.overanalyzed
              ? "Tip: You're rushing sections. Slow down to capture easy points."
              : data.overanalyzed > 5
                ? "Tip: You're over-analyzing. Trust your first instinct more."
                : 'Tip: Great focus! This balanced pace is optimal for your score.'}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function EfficiencyMatrix({ paceData, onDrilldown }) {
  const hasData = paceData && paceData.length > 0;

  const handlePointClick = (data) => {
    if (onDrilldown && data) {
      // For the Efficiency Matrix, we drill down into a single session
      // The modal expects a category and an array of session data
      onDrilldown('session', [
        {
          id: data.id,
          date: data.date,
          type: data.type,
          score: data.score,
          count: data.rushed + data.overanalyzed, // Show combined pacing issues
        },
      ]);
    }
  };

  // Calculate dynamic summary
  const getSmartDescription = () => {
    if (!hasData) return null;
    const avgAccuracy = paceData.reduce((sum, d) => sum + d.accuracy, 0) / paceData.length;
    const totalRushed = paceData.reduce((sum, d) => sum + d.rushed, 0);
    const totalOveranalyzed = paceData.reduce((sum, d) => sum + d.overanalyzed, 0);

    if (avgAccuracy > 80 && totalRushed > totalOveranalyzed) {
      return "Fantastic! You're moving fast while maintaining elite accuracy. This is the goal for Band 8+.";
    }
    if (totalRushed > totalOveranalyzed * 1.5) {
      return "You're leaning towards the 'Quick Zone'. Try slowing down by 10% on your next session to capture easy points you might be rushing.";
    }
    if (totalOveranalyzed > totalRushed) {
      return "You're spending a lot of time in the 'Careful Zone'. Practice trusting your first instinct to improve your speed for the exam.";
    }
    return "You have a well-balanced pace. Keep maintaining this 'Optimal Zone' distribution to minimize stress during the real test.";
  };

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="7bef:.m">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all min-h-[450px] flex flex-col"
        data-oid="86h_66:"
      >
        <CardHeader className="pb-2" data-oid="k060711">
          <div className="flex items-center justify-between gap-3" data-oid="y59faxb">
            <CardTitle
              className="text-xl font-black text-foreground flex items-center gap-2"
              data-oid="b5ewgfg"
            >
              <Timer className="w-5 h-5 text-primary" data-oid="t_5_pk2" />
              Your Pacing Chart
            </CardTitle>
            <Badge
              variant="outline"
              className="rounded-xl border-border/60 bg-muted/40 text-[10px] font-black"
              data-oid="2x4isuw"
            >
              Speed Analysis
            </Badge>
          </div>
          <CardDescription
            className="text-xs font-semibold text-muted-foreground/80"
            data-oid="lk3-j4:"
          >
            See if you are rushing or taking too much time on questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1 relative min-h-0 flex flex-col" data-oid="w-_:m-f">
          {hasData ? (
            <>
              <div className="flex-1 min-h-[220px] relative" data-oid="otzovma">
                <div
                  className="absolute inset-x-8 top-0 bottom-12 border-dashed border-border/20 pointer-events-none"
                  data-oid="vf19a-q"
                >
                  <div
                    className="absolute top-4 right-4 text-[10px] font-black text-rose-500/60 dark:text-rose-400/80 tracking-wide text-right leading-tight"
                    data-oid="sui-haz"
                  >
                    Struggling Zone
                    <br data-oid="tc7:29c" />
                    More Work Needed
                  </div>
                  <div
                    className="absolute bottom-6 right-4 text-[10px] font-black text-amber-500/60 dark:text-amber-400/80 tracking-wide text-right leading-tight"
                    data-oid="4c8a-1u"
                  >
                    Taking Extra Time
                    <br data-oid="abbhdsw" />
                    Very Careful
                  </div>
                  <div
                    className="absolute top-4 left-4 text-[10px] font-black text-rose-400/60 dark:text-rose-400/80 tracking-wide leading-tight"
                    data-oid="3ovh.08"
                  >
                    Rushing Zone
                    <br data-oid="ngaceeg" />
                    Slow Down Slightly
                  </div>
                  <div
                    className="absolute bottom-6 left-4 text-[10px] font-black text-emerald-500/60 dark:text-emerald-400/80 tracking-wide leading-tight"
                    data-oid="dle.k:d"
                  >
                    Perfect Pace
                    <br data-oid="k_2gwmb" />
                    Balanced & Steady
                  </div>
                </div>

                <ResponsiveContainer width="100%" height="100%" data-oid="-eli5z8">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                    data-oid="8rl:zbg"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.2}
                      data-oid="ssssa1l"
                    />

                    <XAxis
                      type="number"
                      dataKey="overanalyzed"
                      name="Carefully Answered"
                      hide
                      domain={[0, 'dataMax + 2']}
                      data-oid="j97-yh."
                    />

                    <YAxis
                      type="number"
                      dataKey="rushed"
                      name="Quick Responses"
                      hide
                      domain={[0, 'dataMax + 2']}
                      data-oid="z:6gisl"
                    />

                    <ZAxis type="number" dataKey="accuracy" range={[100, 400]} data-oid="0c0jgj8" />
                    <Tooltip
                      content={<CustomTooltip data-oid="2iflr-4" />}
                      cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--primary))' }}
                      data-oid="p60icja"
                    />

                    <Scatter
                      name="Pacing Sessions"
                      data={paceData}
                      onClick={(e) => handlePointClick(e.payload)}
                      data-oid="1v1:7b."
                    >
                      {paceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.accuracy >= 70
                              ? 'hsl(var(--primary))'
                              : entry.rushed > entry.overanalyzed
                                ? 'hsl(var(--rose-500))'
                                : 'hsl(var(--amber-500))'
                          }
                          className="drop-shadow-lg transition-all duration-300 hover:opacity-100 opacity-80 cursor-pointer outline-none"
                          data-oid="n0j3c-z"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div
                className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mt-2 mb-4"
                data-oid="d6b0p0j"
              >
                <div className="flex gap-3" data-oid="jmebgnv">
                  <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" data-oid="c8d7n4_" />
                  <p
                    className="text-xs font-semibold text-foreground/80 leading-relaxed italic"
                    data-oid="5g224fr"
                  >
                    "{getSmartDescription()}"
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-between px-2 pt-2 border-t border-border/10"
                data-oid="r8g35l6"
              >
                <div className="flex items-center gap-3" data-oid="aux4_67">
                  <div className="flex items-center gap-1.5" data-oid="cpusqe6">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" data-oid="4g-g9y-" />
                    <span
                      className="text-[10px] font-bold text-muted-foreground"
                      data-oid="xtbt-c-"
                    >
                      Quick
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" data-oid="phlo:6y">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" data-oid="_x-tb0o" />
                    <span
                      className="text-[10px] font-bold text-muted-foreground"
                      data-oid=".ymx09u"
                    >
                      Careful
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-black text-muted-foreground/40 tracking-tighter italic"
                  data-oid="c89_boi"
                >
                  Dot size = Accuracy %
                </span>
              </div>
            </>
          ) : (
            // Empty State
            <EmptyAnalyticsState
              icon={Activity}
              title="Pacing Insights"
              description="Complete a few timed practice tests to see your pacing patterns and find your optimal answering speed."
              compact
              data-oid="z.ejlpw"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
