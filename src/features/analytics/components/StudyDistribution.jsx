import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ITEM_VARIANTS, PIE_COLORS } from '../constants';

export default function StudyDistribution({ stats, chartData }) {
  if (!stats || !chartData) return null;

  return (
    <motion.div variants={ITEM_VARIANTS} data-oid="sv..b0w">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all h-[280px]"
        data-oid="ukjyhga"
      >
        <CardHeader className="pb-3 text-center md:text-left" data-oid="ch18rpz">
          <div
            className="flex flex-col md:flex-row md:items-center justify-between gap-3"
            data-oid="06hn48r"
          >
            <CardTitle
              className="text-xl font-black text-foreground flex items-center justify-center md:justify-start gap-2"
              data-oid="zl1jx.u"
            >
              <Star className="w-5 h-5 text-primary" data-oid=":lu24of" />
              Study Distribution
            </CardTitle>
          </div>
          <CardDescription className="italic font-medium" data-oid="xslvnt1">
            Session density by module.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0" data-oid="mip:8g2">
          <div className="h-[180px] w-full flex items-center justify-center" data-oid="7cddi8c">
            <ResponsiveContainer width="100%" height="100%" data-oid="h1zgmyb">
              <PieChart data-oid=":8rh6:-">
                <Pie
                  data={chartData.pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  data-oid="63bi0gy"
                >
                  {chartData.pie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      data-oid="janz0ih"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  data-oid="90l53.h"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3" data-oid="_39jneq">
            {chartData.pie.map((entry, index) => (
              <div
                key={entry.name}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/20 group hover:bg-muted/50 transition-colors"
                data-oid="t4c:_gr"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  data-oid="a9149a."
                />

                <div className="min-w-0" data-oid="jdmdo_5">
                  <div
                    className="text-sm font-black text-foreground capitalize truncate leading-none mb-1"
                    data-oid="wz5kvod"
                  >
                    {entry.name}
                  </div>
                  <div
                    className="text-xs font-bold text-muted-foreground tracking-widest whitespace-nowrap"
                    data-oid="15yd1tl"
                  >
                    {entry.value} Tests
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
