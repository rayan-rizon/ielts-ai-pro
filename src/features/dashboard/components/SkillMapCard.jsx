import React from 'react';
import { Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import SkillRadarChart from '@/components/dashboard/SkillRadarChart';

const SkillMapCard = React.memo(({ radarData, totalTests = 0 }) => {
  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-sm',
        'hover:shadow-md transition-shadow duration-300',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
      data-oid="cq.oh:8"
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
        data-oid="-4v5pko"
      />

      <CardHeader className="p-4 pb-0" data-oid="kcyg41:">
        <div className="flex items-center justify-between" data-oid="4b3a95l">
          <CardTitle
            className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="t-632:9"
          >
            <div
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-transform group-hover:rotate-12"
              data-oid="76sp200"
            >
              <Target
                className="w-4 h-4 transition-transform duration-500 group-hover:scale-110"
                data-oid="2af2enn"
              />
            </div>
            <div data-oid="iog9cjj">
              <span className="tracking-tight" data-oid="r4bv14h">
                Skill Matrix
              </span>
              <p
                className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5"
                data-oid="pnuz46z"
              >
                Performance Balance
              </p>
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex-1 flex flex-col" data-oid="2_:2de-">
        <div
          className="relative h-[280px] sm:h-[320px] w-full transform group-hover:scale-[1.01] transition-transform duration-700 bg-slate-50/50 dark:bg-black/40 rounded-xl p-2 border border-slate-100 dark:border-white/5 shadow-inner"
          data-oid="xtc_vjg"
        >
          {/* Graph Glow */}
          <div
            className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none"
            data-oid=":w:k9gk"
          />

          <SkillRadarChart data={radarData} data-oid="o5t4uab" />
        </div>
        <div className="mt-3 flex items-center justify-between px-1" data-oid="cp2q63s">
          <div className="flex items-center gap-2.5" data-oid="4u5g:j7">
            <div
              className="h-7 px-2.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-1.5 shadow-sm transition-transform duration-300 hover:scale-105"
              data-oid="th9s-3n"
            >
              <Trophy className="w-3.5 h-3.5" data-oid="trophy-icon" />
              <span className="text-xs font-black tabular-nums" data-oid="_9a37tx">
                {totalTests > 99 ? '99+' : totalTests}
              </span>
            </div>
            <span
              className="text-xs font-bold text-slate-700 dark:text-slate-200"
              data-oid="o9o_jy5"
            >
              Tests Completed
            </span>
          </div>
          <Badge
            variant="outline"
            className="rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-slate-600 dark:text-slate-300"
            data-oid="e_ro_1x"
          >
            ANALYTICS ENGINE
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});

SkillMapCard.displayName = 'SkillMapCard';

export default SkillMapCard;
