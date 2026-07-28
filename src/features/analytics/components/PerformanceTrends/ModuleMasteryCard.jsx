import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBand } from '../../utils';
import UniversalRadar from './UniversalRadar';

export default function ModuleMasteryCard({ radarData }) {
  return (
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
                Skill progress
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
  );
}
