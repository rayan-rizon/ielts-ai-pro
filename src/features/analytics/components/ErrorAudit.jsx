import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, PieChart as PieIcon, ExternalLink } from 'lucide-react';
import { ITEM_VARIANTS } from '../constants';
import EmptyAnalyticsState from './EmptyAnalyticsState';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-2xl"
        data-oid="nq4uozw"
      >
        <div className="text-[10px] font-black text-muted-foreground mb-1" data-oid="w8grf5t">
          {data.name}
        </div>
        <div className="text-lg font-black text-foreground" data-oid="bdu7d4e">
          {data.value} Cases
        </div>
        <div className="text-[9px] font-bold text-primary mt-1 animate-pulse" data-oid="r6i3_eg">
          Click to analyze patterns →
        </div>
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
      return "You're leaving too many questions blank. Always pick an answer! There are no negative marks in IELTS.";
    }
    if (rushed > overanalyzed * 2) {
      return 'You are rushing too much. Slowing down just a little could boost your band score immediately.';
    }
    if (overanalyzed > rushed * 2) {
      return 'You are thinking too long on each question. Trust your first choice more to save time.';
    }
    return 'Your performance is balanced. Focus on your most frequent mistake types to improve your score.';
  };

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="lb6yrrv">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all min-h-[450px] flex flex-col"
        data-oid="l6h7:_6"
      >
        <CardHeader className="pb-2" data-oid="w1sznbb">
          <div className="flex items-center justify-between gap-3" data-oid="0p._.rw">
            <CardTitle
              className="text-xl font-black text-foreground flex items-center gap-2"
              data-oid=":1-v0nr"
            >
              <AlertCircle className="w-5 h-5 text-primary" data-oid="_3fwp::" />
              Answer Analysis
            </CardTitle>
            <Badge
              variant="outline"
              className="rounded-xl border-border/60 bg-muted/40 text-[10px] font-black"
              data-oid="od1xci2"
            >
              Click Any Part
            </Badge>
          </div>
          <CardDescription
            className="text-xs font-semibold text-muted-foreground/80"
            data-oid="jncrkaz"
          >
            See why you missed marks and get tips to improve.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col min-h-0" data-oid="-s_kl9j">
          {hasData ? (
            <>
              <div className="flex-1 min-h-0 relative" data-oid="h.zh80a">
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none"
                  data-oid="fg4w.d."
                >
                  <div
                    className="text-2xl md:text-3xl font-black text-foreground"
                    data-oid="n4.-qub"
                  >
                    {totalPointsLost}
                  </div>
                  <div
                    className="text-[9px] md:text-[10px] font-black text-muted-foreground tracking-widest leading-none"
                    data-oid="z0du9py"
                  >
                    Total Mistakes
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%" data-oid="mrt:xbh">
                  <PieChart data-oid="q540rn-">
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      onClick={handleCellClick}
                      className="cursor-pointer"
                      data-oid="lb_8a-o"
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity outline-none"
                          data-oid="4xo4qv2"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip data-oid="r1oqcfz" />} data-oid="jmj34td" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 mt-2 mb-4"
                data-oid="l.yh1v8"
              >
                <div className="flex gap-2 justify-center" data-oid="insight-wrapper">
                  <AlertCircle
                    className="w-3 h-3 text-rose-500 shrink-0 mt-0.5"
                    data-oid="insight-icon"
                  />
                  <p
                    className="text-[11px] md:text-xs font-semibold text-foreground/80 leading-relaxed italic text-center"
                    data-oid="_2yp0gn"
                  >
                    "{getSmartDescription()}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto" data-oid="6xu9:ya">
                {data.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleCellClick(item)}
                    className="p-2 md:p-2.5 rounded-xl bg-muted/30 border border-border/10 flex items-center gap-2 md:gap-3 hover:bg-muted/50 transition-colors text-left group min-h-[50px]"
                    data-oid="1v-y445"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                      data-oid="9v29jg:"
                    />

                    <div className="flex-1 min-w-0" data-oid="dc_qyf7">
                      <div
                        className="text-[8px] md:text-[9px] font-black text-muted-foreground leading-none truncate"
                        data-oid="fow57u7"
                      >
                        {item.name}
                      </div>
                      <div
                        className="text-xs md:text-sm font-black text-foreground mt-1"
                        data-oid="ztnoqyh"
                      >
                        {item.value}
                      </div>
                    </div>
                    <ExternalLink
                      className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all shrink-0"
                      data-oid="fh.3g7n"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Empty State
            <EmptyAnalyticsState
              icon={PieIcon}
              title="Mistake Tracking"
              description="Keep practicing to see a breakdown of your mistakes and get tips to fix them."
              className="py-12"
              data-oid="nklq56g"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
