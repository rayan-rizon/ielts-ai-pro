import { m } from 'framer-motion';
import Target from 'lucide-react/icons/target';
import Brain from 'lucide-react/icons/brain';
import BarChart3 from 'lucide-react/icons/bar-chart-3';
import Mic from 'lucide-react/icons/mic';
import BookOpen from 'lucide-react/icons/book-open';
import Zap from 'lucide-react/icons/zap';
import Award from 'lucide-react/icons/award';
import { Badge } from '@/components/ui/badge';

export default function DashboardMockup() {
  return (
    <m.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative block w-full"
      data-oid="3pk8:fu"
    >
      {/* Static background glows - optimized for performance */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px] z-0 opacity-25" />
      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] z-0 opacity-15" />

      {/* Main Container */}
      <div
        className="relative z-10 overflow-hidden rounded-[1.5rem] border border-white/20 dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)] transition-all duration-700 hover:shadow-primary/10 group"
        data-oid="2wvzm-b"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
          data-oid="..m.7b-"
        />

        {/* Window Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border/10"
          data-oid="f5szpez"
        >
          <div className="flex items-center gap-2" data-oid="e-0d21i">
            <div
              className="h-2.5 w-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              data-oid="jeovn75"
            />

            <div
              className="h-2.5 w-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              data-oid="doxycbx"
            />

            <div
              className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              data-oid="peeuitk"
            />
          </div>
          <div className="flex items-center gap-3" data-oid="e0sox_k">
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0"
              data-oid="z_peajl"
            >
              <span className="relative flex h-1.5 w-1.5" data-oid=":187zua">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                  data-oid="s-a5fiz"
                ></span>
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"
                  data-oid="g1ogodk"
                ></span>
              </span>
              <span
                className="text-[9px] font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-400"
                data-oid="3:ovnku"
              >
                Live
              </span>
            </div>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex rounded-full border-border/20 bg-background/50 backdrop-blur-md px-2.5 py-0.5 font-black text-[9px] uppercase tracking-wider shadow-sm"
              data-oid="rdm8vj:"
            >
              v2.0
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-3" data-oid="ttdt0qs">
          {/* Performance Summary */}
          <div
            className="rounded-2xl border border-white/20 dark:border-white/5 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent p-4 shadow-sm group/card transition-all duration-500 hover:scale-[1.02] relative overflow-hidden"
            data-oid="kcwg0rj"
          >
            <div
              className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-10 transition-opacity"
              data-oid="0o8j13b"
            >
              <Target className="h-16 w-16 text-primary rotate-12" data-oid="0zds5yw" />
            </div>

            <div className="relative z-10 flex justify-between items-start mb-4" data-oid="up:-y8u">
              <div data-oid="z4gug4t">
                <p
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-primary dark:text-blue-400 mb-1"
                  data-oid="id.m167"
                >
                  Current Proficiency
                </p>
                <h2
                  className="text-xl font-black tracking-tight text-foreground dark:text-white"
                  data-oid="p.-7ejh"
                >
                  Advanced Academic
                </h2>
              </div>
              <div
                className="h-10 w-10 rounded-xl bg-primary dark:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 dark:shadow-blue-500/40 relative"
                data-oid="iqyr_c6"
              >
                <div
                  className="absolute inset-0 bg-white/20 blur-md rounded-full animate-pulse"
                  data-oid="xsntuv0"
                />

                <BarChart3 className="h-5 w-5 relative z-10" data-oid=".pr7k10" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3" data-oid="xos0w.6">
              {[
                {
                  label: 'Writing',
                  score: '7.5',
                  color: 'text-orange-700',
                  bg: 'from-orange-500/10 to-orange-500/5',
                  border: 'border-orange-500/20',
                },
                {
                  label: 'Speaking',
                  score: '8.0',
                  color: 'text-rose-700',
                  bg: 'from-rose-500/10 to-rose-500/5',
                  border: 'border-rose-500/20',
                },
                {
                  label: 'Reading',
                  score: '8.5',
                  color: 'text-blue-700',
                  bg: 'from-blue-500/10 to-blue-500/5',
                  border: 'border-blue-500/20',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-2 rounded-xl bg-gradient-to-br from-background/60 to-background/40 dark:from-black/40 dark:to-black/20 border border-white/20 dark:border-white/5 shadow-sm transition-all duration-300 relative overflow-hidden group/score"
                  data-oid="j6c:lit"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${s.bg} opacity-100 dark:opacity-20 transition-opacity duration-300 rounded-xl`}
                    data-oid="2swclr5"
                  />

                  <div
                    className={`absolute inset-0 opacity-0 dark:group-hover/score:opacity-100 bg-gradient-to-br ${s.bg} blur-md transition-all duration-500`}
                    data-oid="u0hklsl"
                  />

                  <div className="relative z-10" data-oid="_7q-9ej">
                    <p
                      className="text-[8px] font-black uppercase text-muted-foreground dark:text-slate-400 mb-0.5 tracking-wider"
                      data-oid="jcrvxnw"
                    >
                      {s.label}
                    </p>
                    <div className="flex items-center justify-center gap-1" data-oid="w5e:u52">
                      <p
                        className={`text-base font-black ${s.color} dark:text-white sm:text-[15px]`}
                        data-oid="b7mj_ww"
                      >
                        {s.score}
                      </p>
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${s.color.replace('text-', 'bg-')} opacity-60 animate-pulse`}
                        data-oid="diim5t6"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2" data-oid="_8d-j0y">
            <div
              className="rounded-xl border border-white/20 dark:border-white/5 bg-gradient-to-br from-background/60 to-background/40 dark:from-white/5 dark:to-transparent p-2.5 shadow-sm space-y-1.5 transition-all duration-300 relative overflow-hidden group/active"
              data-oid="w7xnwjf"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent dark:from-indigo-500/10 dark:to-transparent opacity-100 transition-opacity duration-300 rounded-xl"
                data-oid="xz_t._d"
              />

              <div className="relative z-10 flex justify-between items-center" data-oid="5:rz3jc">
                <div
                  className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 dark:from-indigo-500/20 dark:to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm"
                  data-oid="qakhair"
                >
                  <Mic className="h-3.5 w-3.5" data-oid="ylixzbl" />
                </div>
                <div className="flex items-center gap-1" data-oid="w.aegh.">
                  <Zap className="h-2.5 w-2.5 text-amber-500 animate-pulse" data-oid="5vi4f3_" />
                  <span
                    className="text-[8px] font-black text-muted-foreground uppercase tracking-wider"
                    data-oid="ashtvuk"
                  >
                    Active
                  </span>
                </div>
              </div>
              <div className="relative z-10" data-oid="5mbvhu9">
                <p
                  className="text-[12px] font-black text-foreground dark:text-white"
                  data-oid="zavgg5l"
                >
                  Fluency Drill
                </p>
                <p
                  className="text-[9px] font-medium text-muted-foreground dark:text-gray-400"
                  data-oid="o9d5wb-"
                >
                  Cue Cards
                </p>
              </div>
              <div
                className="relative z-10 h-1 w-full bg-border/20 rounded-full overflow-hidden"
                data-oid="m2xm.10"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 w-[65%]"
                  data-oid="k4wiv4t"
                />
              </div>
            </div>

            <div
              className="rounded-xl border border-white/20 dark:border-white/5 bg-gradient-to-br from-background/60 to-background/40 dark:from-white/5 dark:to-transparent p-2.5 shadow-sm space-y-1.5 transition-all duration-300 relative overflow-hidden group/active"
              data-oid="_1i92_8"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-blue-500/10 dark:to-transparent opacity-100 transition-opacity duration-300 rounded-xl"
                data-oid="ycvc13v"
              />

              <div className="relative z-10 flex justify-between items-center" data-oid="kn-.mh4">
                <div
                  className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-blue-500/20 dark:to-blue-500/5 border border-primary/20 dark:border-blue-500/20 flex items-center justify-center text-primary dark:text-blue-400 shadow-sm"
                  data-oid="g7qaozl"
                >
                  <BookOpen className="h-3.5 w-3.5" data-oid="ljrq.:u" />
                </div>
                <div className="flex items-center gap-1" data-oid="pfh1cj.">
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"
                    data-oid="nayz795"
                  />

                  <span
                    className="text-[8px] font-black text-muted-foreground uppercase tracking-wider"
                    data-oid="fm3tmzp"
                  >
                    Live
                  </span>
                </div>
              </div>
              <div className="relative z-10" data-oid="fbjtac6">
                <p
                  className="text-[12px] font-black text-foreground dark:text-white"
                  data-oid="l_9c9:."
                >
                  Reading Lab
                </p>
                <p
                  className="text-[9px] font-medium text-muted-foreground dark:text-gray-400"
                  data-oid="wmlgagc"
                >
                  T/F/NG
                </p>
              </div>
              <div
                className="relative z-10 h-1 w-full bg-border/20 rounded-full overflow-hidden"
                data-oid="gkpc2gf"
              >
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 w-[40%]"
                  data-oid=".m1ab3c"
                />
              </div>
            </div>
          </div>

          {/* AI Feedback Bubble */}
          <div className="relative" data-oid="0aze5fc">
            <div
              className="absolute -left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-indigo-500 to-transparent rounded-full"
              data-oid="fcq59q2"
            />

            <div className="pl-5 py-1" data-oid="5:jt_t5">
              <div className="flex items-center gap-2 mb-1.5" data-oid="f-d1:d8">
                <Brain className="h-3.5 w-3.5 text-primary dark:text-blue-400" data-oid="x7fcjsz" />
                <span
                  className="text-[9px] font-black uppercase tracking-widest text-primary dark:text-blue-400"
                  data-oid="iml-w5s"
                >
                  AI Recommendation
                </span>
              </div>
              <p
                className="text-[12px] font-bold leading-relaxed italic text-foreground dark:text-slate-200"
                data-oid="5sjxp6w"
              >
                "Focus on{' '}
                <span
                  className="text-primary dark:text-blue-400 underline underline-offset-4 decoration-primary/30 dark:decoration-blue-500/30"
                  data-oid="6ioaeg6"
                >
                  connective devices
                </span>{' '}
                to hit a Band 8.5."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Achievement Badge - CSS animation instead of framer-motion */}
      <div
        className="absolute -top-6 right-4 lg:-top-6 lg:-right-2 z-30 animate-float-slow"
        data-oid="45y-7yc"
      >
        <div
          className="px-4 py-2.5 rounded-xl bg-background/80 dark:bg-[#0f1115]/90 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 shadow-white/10 dark:shadow-black/20 flex items-center gap-3 scale-90 sm:scale-100 relative overflow-hidden transform transition-transform hover:scale-105 duration-300"
          data-oid="mmoihsa"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-transparent rounded-xl"
            data-oid="wlen3kv"
          />

          <div
            className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 dark:from-amber-500/30 dark:to-amber-500/15 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center shadow-sm"
            data-oid="rz43hzu"
          >
            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" data-oid="y1l9dwm" />
          </div>
          <div className="relative z-10" data-oid="j_qsvn3">
            <p
              className="text-[8px] font-black uppercase text-muted-foreground dark:text-gray-400 leading-none mb-0.5"
              data-oid="ife5n9a"
            >
              Weekly Streak
            </p>
            <p
              className="text-xs font-black text-foreground dark:text-white tracking-tight"
              data-oid="70cc6:1"
            >
              Level 12 reached
            </p>
          </div>
        </div>
      </div>

      {/* Floating Target Score - CSS animation instead of framer-motion */}
      <div className="absolute -bottom-6 -left-6 z-20 animate-float-delayed" data-oid="our.bv_">
        <div
          className="px-3 py-2.5 rounded-xl bg-background/80 dark:bg-[#0f1115]/90 backdrop-blur-xl shadow-2xl border border-white/30 dark:border-white/10 shadow-white/10 dark:shadow-black/20 flex items-center gap-3 scale-90 sm:scale-100 relative overflow-hidden transform transition-transform hover:scale-105 duration-300"
          data-oid="evjg2-i"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-xl"
            data-oid="ltpopzk"
          />

          <div
            className="h-7 w-7 rounded-full border-2 border-primary/50 dark:border-primary/60 border-t-primary bg-background/50 dark:bg-card/50 animate-spin shadow-sm"
            style={{ animationDuration: '3s' }}
            data-oid="x8c_sd-"
          />

          <div className="relative z-10" data-oid="acat-sf">
            <p
              className="text-[8px] font-black uppercase text-muted-foreground dark:text-gray-400 leading-none mb-0.5"
              data-oid="5hph80r"
            >
              System Target
            </p>
            <p
              className="text-xs font-black text-foreground dark:text-white tracking-tight"
              data-oid="p1h70co"
            >
              Band 8.0{' '}
              <span
                className="text-emerald-600 dark:text-emerald-400 text-[9px] ml-1"
                data-oid="6nqn9ir"
              >
                ↑ 0.5
              </span>
            </p>
          </div>
        </div>
      </div>
    </m.div>
  );
}
