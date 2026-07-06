import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function TargetStep({ targetBandScore, onChangeTargetBand }) {
  return (
    <div className="space-y-10 py-6" data-oid="zf8dx6y">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center relative"
        data-oid="hjx0rp8"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-[60px] rounded-full -z-10"
          data-oid="_esz2b5"
        />

        <div className="relative inline-flex flex-col items-center" data-oid="gt:il:1">
          <div
            className="text-7xl font-black bg-gradient-to-br from-primary via-indigo-500 to-violet-600 bg-clip-text text-transparent drop-shadow-sm dark:from-primary dark:via-indigo-400 dark:to-violet-400"
            data-oid="p9fp_w1"
          >
            {targetBandScore.toFixed(1)}
          </div>
          <Badge
            variant="secondary"
            className="mt-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-secondary/80 dark:bg-slate-700 text-foreground dark:text-white backdrop-blur-sm"
            data-oid="hn-dpv5"
          >
            Expert Target
          </Badge>
        </div>
      </motion.div>

      <div className="px-6 space-y-6" data-oid="-ywyw-b">
        <div className="relative pt-6" data-oid="-f3abe.">
          <Slider
            defaultValue={[7.0]}
            min={4.0}
            max={9.0}
            step={0.5}
            value={[targetBandScore]}
            onValueChange={(val) => onChangeTargetBand(val[0])}
            className="w-full relative z-10"
            data-oid="gbef9yl"
          />
        </div>
        <div className="flex justify-between px-1" data-oid="h0tkkbv">
          {[4.0, 5.0, 6.0, 7.0, 8.0, 9.0].map((score) => (
            <div key={score} className="flex flex-col items-center gap-2" data-oid="3iy-5t-">
              <div
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-300',
                  targetBandScore === score ? 'bg-primary scale-150' : 'bg-border'
                )}
                data-oid="5f2c28p"
              />

              <span
                className={cn(
                  'text-[10px] transition-all duration-300 font-bold tracking-tighter',
                  targetBandScore === score
                    ? 'text-primary scale-125 dark:text-primary'
                    : 'text-muted-foreground dark:text-slate-400'
                )}
                data-oid="k0derq:"
              >
                {score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div
          className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3"
          data-oid="x4kg6by"
        >
          <div
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
            data-oid="yafxg_e"
          >
            <Brain className="w-4 h-4 text-primary" data-oid="xseyjks" />
          </div>
          <p
            className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed"
            data-oid="odqck.w"
          >
            Most Ivy League universities require a{' '}
            <span className="text-foreground dark:text-white font-bold" data-oid="6sffuri">
              7.5+
            </span>
            . We'll adjust your learning path to hit this mark.
          </p>
        </div>
      </div>
    </div>
  );
}
