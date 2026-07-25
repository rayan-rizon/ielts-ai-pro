import React from 'react';
import { Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuestionTypeTable from './QuestionTypeTable';
import { getQuestionSuccessSummary } from './SharedHelpers';

export default function QuestionSuccessCard({ stats }) {
  const questionSuccessSummary = getQuestionSuccessSummary(stats?.typeAccuracy);

  return (
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
        <QuestionTypeTable data={stats?.typeAccuracy} data-oid="uv1t-vc" />
      </CardContent>
    </Card>
  );
}
