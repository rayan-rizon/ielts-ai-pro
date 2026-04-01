import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEM_VARIANTS } from '../constants';
import EmptyAnalyticsState from './EmptyAnalyticsState';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-2xl"
        data-oid=":qwe4om"
      >
        <div className="flex items-center gap-2 mb-2" data-oid="2ergm3n">
          <Badge
            className={cn(
              data.isForecast
                ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                : 'bg-primary/10 text-primary dark:text-blue-400',
              'border-0'
            )}
            data-oid="_31sywd"
          >
            {data.isForecast ? 'Projection' : 'Current'}
          </Badge>
          <span className="text-[10px] font-black text-muted-foreground" data-oid="fj9g561">
            {data.date}
          </span>
        </div>
        <div className="flex items-baseline gap-1" data-oid="vc9inot">
          <span className="text-2xl font-black text-foreground" data-oid="_6td1g9">
            {data.score.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground" data-oid="9zrj5ve">
            Band
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ScoreForecast({ forecastData, targetScore }) {
  if (!forecastData || forecastData.length === 0) {
    return (
      <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="c1teu:f">
        <Card
          className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden h-[400px] flex flex-col"
          data-oid="i:bueg2"
        >
          <CardHeader className="pb-2" data-oid="6t.tu80">
            <div className="flex items-center justify-between gap-3" data-oid="e6rb0u6">
              <CardTitle
                className="text-xl font-black text-foreground flex items-center gap-2"
                data-oid="t-q9d3q"
              >
                <Target
                  className="w-5 h-5 text-indigo-500 dark:text-indigo-400"
                  data-oid="nrdzosg"
                />
                Band 9 Projector
              </CardTitle>
              <Badge
                variant="outline"
                className="rounded-xl border-border/60 bg-muted/40 text-[10px] font-black"
                data-oid="_zdt5oc"
              >
                Motivation
              </Badge>
            </div>
            <CardDescription data-oid="z374fg6">
              Estimated path to your target score based on current trend.
            </CardDescription>
          </CardHeader>
          <CardContent
            className="flex-1 flex flex-col justify-center items-center"
            data-oid="pd3:pf-"
          >
            <EmptyAnalyticsState
              icon={Target}
              title="Forecasting Pending"
              description="Complete at least 3 practice tests to unlock your AI-powered band score projection."
              className="py-6"
              data-oid="w7:0dde"
            />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="rbcr9-f">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all h-[400px] flex flex-col"
        data-oid="qha72_n"
      >
        <CardHeader className="pb-2" data-oid="_m62w1z">
          <div className="flex items-center justify-between gap-3" data-oid="wod3056">
            <CardTitle
              className="text-xl font-black text-foreground flex items-center gap-2"
              data-oid="djnbfk."
            >
              <Target className="w-5 h-5 text-indigo-500" data-oid="my4-5wl" />
              Band 9 Projector
            </CardTitle>
            <Badge
              variant="outline"
              className="rounded-xl border-border/60 bg-muted/40 text-[10px] font-black"
              data-oid="6g66uzo"
            >
              Motivation
            </Badge>
          </div>
          <CardDescription data-oid="iorkmnl">
            Estimated path to your target score based on current trend.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1 min-h-0 relative" data-oid="a2drvx7">
          <ResponsiveContainer width="100%" height="100%" data-oid="krbal9s">
            <AreaChart
              data={forecastData}
              margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
              data-oid="se40zo1"
            >
              <defs data-oid="hx_yse0">
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1" data-oid="eog35ly">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                    data-oid=":2v2o-j"
                  />

                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                    data-oid="y02xl.z"
                  />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1" data-oid="znv.tv2">
                  <stop
                    offset="5%"
                    stopColor="rgb(99, 102, 241)"
                    stopOpacity={0.3}
                    data-oid="r6r3_.y"
                  />

                  <stop
                    offset="95%"
                    stopColor="rgb(99, 102, 241)"
                    stopOpacity={0}
                    data-oid="2jyru6:"
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.2}
                data-oid="x_h9ngb"
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                dy={10}
                data-oid="lw1mmc1"
              />

              <YAxis
                domain={[0, 9]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                data-oid="4y2w-h7"
              />

              <Tooltip content={<CustomTooltip data-oid="15k32ip" />} data-oid="o91vu9w" />
              <ReferenceLine
                y={targetScore}
                stroke="hsl(var(--indigo-500))"
                strokeDasharray="5 5"
                label={{
                  value: 'Target',
                  fill: 'hsl(var(--indigo-500))',
                  fontSize: 10,
                  fontWeight: 900,
                  position: 'right',
                }}
                data-oid="7w3cpjh"
              />

              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorScore)"
                animationDuration={2000}
                data-oid="qqphfyx"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
