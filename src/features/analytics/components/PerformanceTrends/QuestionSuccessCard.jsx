import React from 'react';
import { Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuestionTypeTable from './QuestionTypeTable';
import { getQuestionSuccessSummary } from './SharedHelpers';

export default function QuestionSuccessCard({ stats }) {
  const questionSuccessSummary = getQuestionSuccessSummary(stats?.typeAccuracy);

  return (
    <Card className="flex h-[360px] flex-col overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
      <CardHeader className="px-4 pb-2 pt-4 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
              <Target className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Question Success Rate
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-slate-500 truncate">
                Weighted accuracy across completed questions.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-0 bg-emerald-50 px-2.5 py-0.5 text-[9.5px] font-black uppercase text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200/70"
          >
            {questionSuccessSummary.total
              ? `${questionSuccessSummary.accuracy}% overall`
              : 'No data'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-3.5 pb-3.5 pt-1 sm:px-4.5 scrollbar-thin scrollbar-thumb-muted">
        <QuestionTypeTable data={stats?.typeAccuracy} />
      </CardContent>
    </Card>
  );
}
