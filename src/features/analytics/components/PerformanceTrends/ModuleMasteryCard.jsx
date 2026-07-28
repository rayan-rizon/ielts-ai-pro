import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../../constants';
import { formatBand } from '../../utils';
import UniversalRadar from './UniversalRadar';

export default function ModuleMasteryCard({ radarData }) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
        <CardHeader className="px-4 pb-1 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
                <TrendingUp className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                  Skill progress
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-500 truncate">
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
          <div className="w-full sm:w-[62%] h-[210px] sm:h-full flex items-center justify-center">
            <UniversalRadar data={radarData} name="Band Performance" color="primary" />
          </div>
          <div className="w-full sm:w-[38%] space-y-1.5">
            {radarData.map((item, idx) => {
              const moduleColorMap = {
                Reading: 'from-[#5661e9] to-[#818cf8]',
                Writing: 'from-[#0284c7] to-[#38bdf8]',
                Listening: 'from-[#6366f1] to-[#a5b4fc]',
                Speaking: 'from-[#8b5cf6] to-[#c084fc]',
              };
              const gradient = moduleColorMap[item.subject] || 'from-[#5661e9] to-[#818cf8]';
              return (
                <motion.div
                  key={item.subject}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-lg border border-slate-200/60 bg-white/80 p-1.5 dark:border-white/5 dark:bg-white/[0.03] space-y-0.5"
                >
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
                      {item.subject}
                    </span>
                    <span className="text-[10.5px] font-black text-slate-950 dark:text-white">
                      {formatBand(item.A)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.A / 9) * 100}%` }}
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                        gradient
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
