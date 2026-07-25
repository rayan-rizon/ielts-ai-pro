import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const LockedFeature = React.memo(function LockedFeature({
  isLocked,
  children,
  className,
  compact = false,
}) {
  if (!isLocked) return children;

  return (
    <div
      className={cn('relative group/locked h-full overflow-hidden', className)}
      data-oid="ks:eu.o"
    >
      <div
        className="blur-[12px] select-none pointer-events-none opacity-25 transition-all duration-700 scale-[0.98]"
        data-oid="-8_:k6d"
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
        data-oid="ukiqp7l"
      >
        <div
          className={cn(
            'w-full rounded-[2rem] border border-amber-500/30 bg-card p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] transform group-hover/locked:scale-[1.01] transition-all duration-500 ring-1 ring-white/10',
            compact ? 'max-w-[280px] p-4 sm:p-5' : 'max-w-[340px]'
          )}
          data-oid="i5mz2xi"
        >
          <div className="flex flex-col items-center text-center gap-4" data-oid="do5kko:">
            {!compact && (
              <div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/40 group-hover/locked:rotate-6 transition-transform duration-500"
                data-oid="9gty6zb"
              >
                <Zap className="w-7 h-7 fill-white/20" data-oid="csyu73." />
              </div>
            )}

            <div className={cn('space-y-1.5', compact ? 'text-sm' : '')} data-oid="82z7t_n">
              <div
                className={cn(
                  'font-black text-foreground tracking-tight underline decoration-amber-500/30 decoration-4 underline-offset-4',
                  compact ? 'text-lg' : 'text-xl'
                )}
                data-oid="i3-bqsx"
              >
                Unlock Pro Insights
              </div>
              <p
                className="text-sm font-bold text-muted-foreground/80 leading-relaxed max-w-[240px]"
                data-oid="xxx_xou"
              >
                Gain access to detailed progress patterns and hit your{' '}
                <span
                  className="text-amber-600 dark:text-amber-400 font-black italic"
                  data-oid="pdsmy9k"
                >
                  9.0 Band
                </span>{' '}
                goal faster.
              </p>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-black text-xs tracking-widest rounded-xl shadow-lg shadow-amber-500/25 h-10 group/btn"
              data-oid="-c9-t9y"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>

            {!compact && (
              <div className="pt-2 flex flex-col items-center gap-2" data-oid="social">
                <div className="flex -space-x-2" data-oid="avatars">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar
                      key={i}
                      className="w-6 h-6 border-2 border-background ring-1 ring-amber-500/10"
                      data-oid={`av-${i}`}
                    >
                      <AvatarImage src={`https://i.pravatar.cc/100?u=${i + 10}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border-2 border-background text-xs font-black text-amber-600 ring-1 ring-amber-500/10">
                    +2k
                  </div>
                </div>
                <span className="text-xs font-black text-muted-foreground tracking-widest">
                  Join 2,500+ successful students
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default LockedFeature;
