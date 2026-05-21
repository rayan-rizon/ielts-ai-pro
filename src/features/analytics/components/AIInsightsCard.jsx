import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, Star, Flag, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconWrapper } from './AnalyticsHeader';
import { ITEM_VARIANTS, MODULE_META } from '../constants';
import { createPageUrl } from '@/utils';
import { formatBand } from '../utils';
import EmptyAnalyticsState from './EmptyAnalyticsState';

const LearningRoadmap = React.memo(function LearningRoadmap({ phase, milestone }) {
  const Icon = phase.Icon;
  return (
    <div className="space-y-1.5 mt-2 pt-2 border-t border-border/20" data-oid="c7hzh8d">
      <div className="flex items-center justify-between" data-oid="p6n1twc">
        <div className="flex items-center gap-2" data-oid="96fl6t_">
          <div
            className={cn('p-1.5 rounded-lg text-white shadow-sm bg-gradient-to-br', phase.tone)}
            data-oid="85cy27f"
          >
            <Icon className="w-3 h-3" data-oid="bki5g06" />
          </div>
          <div data-oid="0n4ztw6">
            <div
              className="text-[10px] font-black text-foreground tracking-tight"
              data-oid="vs7tywo"
            >
              {phase.label} Phase
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" data-oid="gl:ah94">
          <span className="text-[10px] font-black text-foreground" data-oid="d8cj6yp">
            {Math.round(phase.progress)}%
          </span>
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 bg-primary/5 text-primary text-[8px] font-black px-1.5 py-0"
            data-oid="w4fsad_"
          >
            Milestone: {milestone.target}
          </Badge>
        </div>
      </div>

      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden" data-oid=":0cmrlp">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${phase.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full shadow-sm bg-gradient-to-r', phase.tone)}
          data-oid="0_1.12g"
        />
      </div>
    </div>
  );
});

const FocusArea = React.memo(function FocusArea({ area, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * idx }}
      className="p-2 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-all duration-300 group relative overflow-hidden"
      data-oid="7qhmpuf"
    >
      <div className="flex items-center gap-2" data-oid="vhar_y7">
        <div
          className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0"
          data-oid="rkbonte"
        >
          <Rocket className="w-3 h-3" data-oid="09542tv" />
        </div>
        <div className="min-w-0" data-oid="d_p:vud">
          <p
            className="text-[8px] font-black text-primary dark:text-primary/90 tracking-tighter truncate"
            data-oid="vv.e_x_"
          >
            {area.module || 'Focus Area'}
          </p>
        </div>
      </div>
      <p
        className="text-[9px] font-medium text-muted-foreground truncate italic mt-1 pl-1"
        data-oid="bxfh:qi"
      >
        {area.strategy || area.description || (typeof area === 'string' ? area : '')}
      </p>
    </motion.div>
  );
});

function PredictionCard({ icon, label, value, color }) {
  return (
    <div
      className="rounded-xl bg-background/50 border border-border/30 p-2 group"
      data-oid="ukvzpsg"
    >
      <div className="flex items-center gap-2" data-oid="7jwgrot">
        <IconWrapper
          icon={icon}
          color={color}
          className="w-6 h-6 p-1 rounded-lg"
          data-oid="-_gvhzq"
        />

        <div className="min-w-0" data-oid="nwkofu7">
          <div
            className="text-[8px] font-black tracking-tighter text-muted-foreground"
            data-oid="3egp:6."
          >
            {label}
          </div>
          <div className="text-sm font-black text-foreground leading-none" data-oid="f6wa9k0">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

const LockedFeature = React.memo(function LockedFeature({ isLocked, children }) {
  if (!isLocked) return children;

  return (
    <div className="relative group/locked min-h-[160px] h-full overflow-hidden" data-oid="mft:nej">
      <div
        className="blur-[12px] select-none pointer-events-none opacity-25 transition-all duration-700 scale-[0.97]"
        data-oid="o-uolu:"
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center p-3 sm:p-5"
        data-oid=".32my93"
      >
        <div
          className="w-full max-w-[320px] rounded-[2rem] border border-amber-500/20 bg-background/40 backdrop-blur-3xl p-4 sm:p-5 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.2)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transform group-hover/locked:scale-[1.01] transition-all duration-500 ring-1 ring-white/10"
          data-oid="bh9z.-d"
        >
          <div className="flex flex-col items-center text-center gap-4" data-oid="gotmz4_">
            <div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 relative overflow-hidden"
              data-oid="nd1v8qm"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <Star className="w-6 h-6 fill-white/20 relative z-10" data-oid="pjfbfep" />
            </div>

            <div className="space-y-1" data-oid="1-_ungq">
              <div
                className="text-base sm:text-lg font-black text-foreground tracking-tight leading-none"
                data-oid="-rnssvn"
              >
                Unlock AI Roadmap
              </div>
              <p
                className="text-[11px] sm:text-xs font-medium text-muted-foreground/80 leading-relaxed max-w-[220px] mx-auto"
                data-oid="qou.wzv"
              >
                Personalized study paths, band predictions, and specific strategies to hit your{' '}
                <span
                  className="text-amber-600 dark:text-amber-500 font-black italic"
                  data-oid="-f_qc8z"
                >
                  9.0 target
                </span>{' '}
                faster.
              </p>
            </div>

            <div className="w-full pt-0.5" data-oid="l_am97w">
              <Button
                asChild
                className="w-full h-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-black text-[10px] tracking-[0.2em] rounded-2xl shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/settings/subscription">Upgrade Now</Link>
              </Button>
            </div>

            <div className="pt-3 border-t border-border/20 w-full" data-oid="0t-f_wj">
              <div className="flex flex-col items-center gap-2" data-oid="zonshi8">
                <div className="flex -space-x-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar
                      key={i}
                      className="w-6 h-6 border-2 border-background shadow-sm ring-1 ring-white/10"
                      data-oid={`avatar-${i}`}
                    >
                      <AvatarImage
                        src={`https://i.pravatar.cc/100?u=ielts_student_${i}`}
                        alt="Student"
                      />
                      <AvatarFallback className="bg-amber-100 text-[8px] font-black text-amber-600">
                        {i}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-[9px] font-black text-muted-foreground/50 tracking-[0.15em]">
                  Join 2,500+ successful students
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function AIInsightsCard({
  stats,
  aiLoading,
  isPremium,
  learningPhase,
  nextMilestone,
  compact = false,
}) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full" data-oid="uwa-quf">
      <Card
        className={cn(
          'rounded-3xl bg-white dark:bg-slate-950 backdrop-blur-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-border/40',
          compact ? 'min-h-[420px]' : 'min-h-[280px]',
          isPremium ? 'ring-2 ring-amber-400/20 ring-offset-2 ring-offset-background' : ''
        )}
        data-oid="xikm8:d"
      >
        <CardHeader className="p-4 pb-1 relative" data-oid="6cub8:6">
          {/* Background Gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none"
            data-oid="-5m3n04"
          />

          {/* Animated Glow Effect */}
          {isPremium && (
            <div className="absolute inset-0 opacity-20" data-oid=":5fe6ot">
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full blur-2xl animate-pulse"
                data-oid="0monv4k"
              />

              <div
                className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-primary to-indigo-500 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: '1s' }}
                data-oid="warevu:"
              />
            </div>
          )}

          <div
            className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3"
            data-oid="8i64fmx"
          >
            <CardTitle
              className="text-lg font-black text-foreground flex items-center gap-2"
              data-oid="h7i.tnz"
            >
              <div
                className={cn(
                  'p-2 rounded-xl shadow-md transition-all duration-300',
                  isPremium
                    ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white'
                    : 'bg-gradient-to-br from-primary to-indigo-600 text-white'
                )}
                data-oid="w-.6ht4"
              >
                <Sparkles
                  className={cn('w-3.5 h-3.5', isPremium && 'animate-pulse')}
                  data-oid=".gsd50e"
                />
              </div>
              <span
                className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                data-oid="n3mnzd5"
              >
                AI Analytics
              </span>
            </CardTitle>
            <div className="flex items-center gap-2" data-oid="xsaj8ol">
              {!isPremium && (
                <Badge
                  className="rounded-lg bg-orange-500 text-white border-0 font-black text-[7px] tracking-tighter px-1.5 py-0.5"
                  data-oid="9ug6b0s"
                >
                  PRO
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-lg border-0 font-bold text-[8px] tracking-tight px-2 py-1',
                  isPremium
                    ? 'bg-primary/10 text-primary dark:text-blue-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                )}
                data-oid="iy2ikht"
              >
                {isPremium ? 'Active' : 'Locked'}
              </Badge>
            </div>
          </div>
          <CardDescription
            className={cn(
              'font-medium text-[11px] leading-tight max-w-sm relative z-10 mt-1.5 opacity-80',
              !isPremium && 'text-muted-foreground'
            )}
            data-oid="iqubwod"
          >
            Prediction & growth engine.
          </CardDescription>
        </CardHeader>
        <CardContent
          className="pt-0 overflow-y-auto scrollbar-none flex-1 relative"
          data-oid="4bw-hw:"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" data-oid="9:-5.q9">
            <div
              className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,theme(colors.primary.DEFAULT)_1px,transparent_1px)] [background-size:20px_20px]"
              data-oid="y-undyh"
            />
          </div>

          {!isPremium && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-orange-600/5 pointer-events-none"
              data-oid="7l8b860"
            />
          )}
          <LockedFeature isLocked={!isPremium} data-oid="996nby3">
            <div className="space-y-2" data-oid="sq_34xw">
              {aiLoading ? (
                <InsightsLoadingSkeleton data-oid="xf-mj53" />
              ) : stats?.insights?.aiSuggestions ? (
                <>
                  <div
                    className="rounded-xl bg-primary/5 p-3 relative overflow-hidden border border-primary/10"
                    data-oid="9vk.rgv"
                  >
                    <div className="relative z-10" data-oid="mgcr6:b">
                      <div className="flex items-center gap-2 mb-1" data-oid="ix.5k0k">
                        <Rocket className="w-3.5 h-3.5 text-primary" data-oid="deniutw" />
                        <div
                          className="text-[9px] font-black text-primary dark:text-primary/90 tracking-tighter"
                          data-oid="h6e2dsd"
                        >
                          Growth Path
                        </div>
                      </div>
                      <div
                        className="text-[11px] font-bold text-foreground leading-snug pl-0.5"
                        data-oid="vxd8cqz"
                      >
                        {stats.insights.aiSuggestions.learning_path_overview ||
                          'Focus on consistency.'}
                      </div>
                    </div>
                  </div>

                  {stats.insights.aiSuggestions.recommended_focus_areas?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2" data-oid="j8hpckz">
                      {stats.insights.aiSuggestions.recommended_focus_areas
                        .slice(0, 2)
                        .map((focus, i) => (
                          <FocusArea key={i} area={focus} idx={i} data-oid="pvb4b-a" />
                        ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2" data-oid="mho_cx6">
                    <PredictionCard
                      icon={Rocket}
                      label="Prediction"
                      value={stats?.insights?.predictedScore || '0.0'}
                      color="bg-primary"
                      data-oid="oeu4uwz"
                    />

                    <PredictionCard
                      icon={Flag}
                      label="Next Goal"
                      value={formatBand(nextMilestone?.target) || '0.0'}
                      color="bg-emerald-500"
                      data-oid=":i6z5te"
                    />
                  </div>
                  <LearningRoadmap
                    phase={learningPhase}
                    milestone={nextMilestone}
                    data-oid="zztm6zz"
                  />
                </>
              ) : stats?.avgScore > 0 ? (
                <EmptyAnalyticsState
                  icon={Sparkles}
                  title="Generating Path"
                  description="Our AI is analyzing your performance. Complete one more test for a full roadmap."
                  className="mt-12 mb-8 py-8"
                  data-oid="p1nc8nh"
                />
              ) : (
                <EmptyAnalyticsState
                  icon={Rocket}
                  title="Start Journey"
                  description="Take your first practice test to unlock personalized AI growth strategies."
                  className="mt-12 mb-8 py-8"
                  data-oid="b8kvq:y"
                />
              )}

              {stats?.insights?.recommendations?.length > 0 && (
                <div className="space-y-2 mt-3 pt-2 border-t border-border/40" data-oid="5s:lwz7">
                  <div
                    className="text-[10px] font-black text-muted-foreground tracking-[0.25em] px-2 flex items-center gap-2"
                    data-oid="4q5myjb"
                  >
                    <div
                      className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 animate-pulse"
                      data-oid="fv:1y1d"
                    />
                    Strategic Boosters
                  </div>
                  <div className="space-y-2" data-oid=":r.cwew">
                    {stats.insights.recommendations.slice(0, 3).map((rec, idx) => {
                      const meta = MODULE_META.find((m) => m.key === rec.type);
                      return (
                        <Link
                          key={`${rec.type}-${idx}`}
                          to={meta?.href || createPageUrl('Dashboard')}
                          className="block rounded-2xl bg-gradient-to-br from-card/80 to-card/60 border border-border/50 hover:from-card/90 hover:to-card/70 transition-all duration-300 p-3 group hover:shadow-lg hover:-translate-y-0.5"
                          data-oid="02rvrq."
                        >
                          <div className="flex items-center gap-3" data-oid="rai:nh1">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-110 shadow-sm relative overflow-hidden',
                                rec.type === 'reading'
                                  ? 'bg-blue-500/10 border-blue-500/20'
                                  : rec.type === 'listening'
                                    ? 'bg-violet-500/10 border-violet-500/20'
                                    : rec.type === 'writing'
                                      ? 'bg-orange-500/10 border-orange-500/20'
                                      : rec.type === 'speaking'
                                        ? 'bg-emerald-500/10 border-emerald-500/20'
                                        : 'bg-primary/10 border-primary/20'
                              )}
                              data-oid="pn8rha_"
                            >
                              {meta ? (
                                <meta.icon
                                  className={cn(
                                    'w-5 h-5',
                                    rec.type === 'reading'
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : rec.type === 'listening'
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : rec.type === 'writing'
                                          ? 'text-orange-600 dark:text-orange-400'
                                          : rec.type === 'speaking'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-primary'
                                  )}
                                />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0" data-oid="8yy7h1n">
                              {meta?.title && (
                                <div className="text-[9px] font-black text-primary/80 dark:text-blue-400/80 tracking-widest mb-0.5">
                                  {meta.title} Booster
                                </div>
                              )}
                              <div
                                className="text-sm font-bold text-foreground leading-snug"
                                data-oid="vqp-mrs"
                              >
                                {rec.text}
                              </div>
                            </div>
                            <ArrowRight
                              className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-300 translate-x-0 group-hover:translate-x-1"
                              data-oid="e3szq8z"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </LockedFeature>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" data-oid="jvv0gx6">
      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5" data-oid="_ig2:a:">
        <div className="flex items-center gap-2 mb-3" data-oid=":u-w-d_">
          <div className="w-8 h-8 rounded-lg bg-muted/60" data-oid="9tmgva4" />
          <div className="h-3 w-24 rounded bg-muted/60" data-oid="wzf2a0y" />
        </div>
        <div className="space-y-2" data-oid="ydn4s7m">
          <div className="h-3 w-full rounded bg-muted/50" data-oid="18xmvj." />
          <div className="h-3 w-4/5 rounded bg-muted/50" data-oid=".6znhha" />
        </div>
      </div>
      <div className="space-y-3" data-oid="zp:t38o">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/30 bg-card/20 p-4 flex items-start gap-4"
            data-oid="zm_qk_4"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 shrink-0" data-oid="nnvk9vi" />
            <div className="flex-1 space-y-2 pt-1" data-oid="by-vlp3">
              <div className="h-2.5 w-full rounded bg-muted/40" data-oid="o5:s_-1" />
              <div className="h-2.5 w-3/4 rounded bg-muted/40" data-oid="9e2mlu9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
