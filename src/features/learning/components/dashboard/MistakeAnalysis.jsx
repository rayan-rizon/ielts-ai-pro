import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { GlassCard } from '../SharedComponents';
import { mistakeAdvice } from '../../utils/learningUtils';
import { cn } from '@/lib/utils';

const MistakeAnalysis = ({ mistakePatterns, onSelectToday, className }) => {
  const navigate = useNavigate();

  return (
    <GlassCard
      className={cn('p-5 md:p-8 border-t-2 border-t-rose-500/30', className)}
      data-oid="c52ljmm"
    >
      <div className="flex items-center justify-between gap-3 mb-6" data-oid="ut1wf9y">
        <div className="flex items-center gap-3" data-oid="-xss1.4">
          <div
            className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shadow-lg shadow-rose-500/5"
            data-oid="9fgr-vd"
          >
            <Zap className="w-5 h-5 text-rose-500" data-oid="713lnsk" />
          </div>
          <div data-oid="o3yj.7i">
            <h2 className="text-lg font-black tracking-tight dark:text-white" data-oid="rmdmnb8">
              Common Mistakes
            </h2>
            <div className="text-[11px] font-semibold text-muted-foreground" data-oid="8zhmqu3">
              Based on your recent error tags
            </div>
          </div>
        </div>
        <Badge
          className="bg-rose-500/10 text-rose-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest"
          data-oid="4d3v75t"
        >
          Last 14 days
        </Badge>
      </div>

      {!mistakePatterns.length ? (
        <div
          className="py-10 text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/5"
          data-oid="c_uvxjt"
        >
          <Zap
            className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto"
            data-oid="w9kcq1q"
          />
          <div className="max-w-[260px] mx-auto space-y-1">
            <h4 className="text-sm font-black dark:text-white">No mistake patterns yet</h4>
            <p
              className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed"
              data-oid="cacxs.a"
            >
              Complete a Reading or Listening test to start tracking your error patterns
              automatically.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-oid="7nxl0r3"
          aria-live="polite"
          role="status"
          aria-label="Common mistake patterns"
        >
          {mistakePatterns.map((p) => {
            const advice = mistakeAdvice(p.tag);
            const targetModule = advice.module || p.module;
            return (
              <div
                key={p.tag}
                className="p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-3"
                data-oid="m-orq99"
              >
                <div className="flex items-start justify-between gap-3" data-oid="w4.tuan">
                  <div className="min-w-0" data-oid="01rxfn:">
                    <div
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500"
                      data-oid="3xghvxo"
                    >
                      {advice.title}
                    </div>
                    <div
                      className="text-sm font-black tracking-tight dark:text-white truncate"
                      data-oid="lh.vof2"
                    >
                      {p.tag}
                    </div>
                  </div>
                  <Badge
                    className="bg-slate-900 text-white dark:bg-white/10 dark:text-white border-0 text-[10px] font-black h-6 px-3 rounded-full"
                    data-oid="drlwn06"
                  >
                    {p.count}x
                  </Badge>
                </div>

                <div
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed min-h-[44px]"
                  data-oid="q7ouzxr"
                >
                  {advice.tip}
                </div>

                <div className="flex items-center justify-between gap-2" data-oid="7-ipwy8">
                  <div className="text-[10px] font-bold text-muted-foreground" data-oid="b5dn9bh">
                    {targetModule ? `Train in ${targetModule}` : 'Train now'}
                  </div>
                  <Button
                    size="sm"
                    className="rounded-2xl h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => {
                      if (targetModule) {
                        navigate(
                          createPageUrl(
                            targetModule.charAt(0).toUpperCase() + targetModule.slice(1)
                          )
                        );
                        return;
                      }
                      onSelectToday?.();
                    }}
                    data-oid="8v81jf:"
                  >
                    Mini Drill
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" data-oid="orl69st" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default memo(MistakeAnalysis);
