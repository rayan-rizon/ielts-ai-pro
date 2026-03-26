import React from 'react';
import { m } from 'framer-motion';
import { XCircle, BadgeAlert, Clock, Target, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProblemSection({ viewport }) {
  const problems = [
    {
      title: 'Slow & Generic Feedback',
      desc: 'Avoid vague coaching. Get instant, examiner-grade feedback on Writing and Speaking.',
      icon: Clock,
      color: 'text-rose-500',
      hoverColor: 'group-hover:text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'The Scoring Lottery',
      desc: 'Skip subjective marking. Our AI uses official IELTS rubrics for consistent scoring.',
      icon: Target,
      color: 'text-orange-500',
      hoverColor: 'group-hover:text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'No Clear Performance Roadmap',
      desc: 'Stop guessing your progress. Use data-backed analytics to hit your target band score.',
      icon: AlertTriangle,
      color: 'text-amber-500',
      hoverColor: 'group-hover:text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <section
      id="problem"
      className="scroll-mt-24 py-8 md:py-12 relative overflow-hidden bg-background"
      data-oid="nfp:pnb"
    >
      <div className="mx-auto max-w-7xl px-6" data-oid="ou3:.1x">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center" data-oid="1odpyt7">
          <m.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={containerVariants}
            data-oid="y1ppqsu"
          >
            <Badge
              variant="secondary"
              className="rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/40 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-sm"
              data-oid="f7tipx6"
            >
              The Challenge
            </Badge>
            <m.h2 variants={itemVariants} className="heading-lg" data-oid="dbj035p">
              Why Many IELTS Students <br data-oid="mz8asnt" />
              Get Stuck at{' '}
              <span className="text-gradient-primary" data-oid="l12khod">
                Band 6.5
              </span>
            </m.h2>
            <m.p
              variants={itemVariants}
              className="body-lg mb-10 text-muted-foreground/90 font-medium"
              data-oid="dw7ceqc"
            >
              Stop repeating the same mistakes. Use AI-powered feedback to pinpoint exactly which
              IELTS band descriptors are holding your score back.
            </m.p>

            <m.ul variants={containerVariants} className="space-y-6" data-oid="p45ytbe">
              {problems.map((item, i) => (
                <m.li
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-5 group"
                  data-oid="v_np0u1"
                >
                  <div
                    className={cn(
                      'mt-1 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-all duration-500 scale-110 rotate-6 shadow-md',
                      item.bg,
                      item.color
                    )}
                    data-oid="1muva2h"
                  >
                    <item.icon className="h-6 w-6" strokeWidth={2.5} data-oid="c7subc9" />
                  </div>
                  <div className="flex-1" data-oid="0kwlwo8">
                    <div
                      className={cn(
                        'text-xl font-black tracking-tight text-foreground transition-colors duration-300',
                        item.hoverColor
                      )}
                      data-oid="9:hd4wl"
                    >
                      {item.title}
                    </div>
                    <p
                      className="text-[15px] font-medium text-muted-foreground/80 leading-relaxed mt-1.5"
                      data-oid="6lremqw"
                    >
                      {item.desc}
                    </p>
                  </div>
                </m.li>
              ))}
            </m.ul>
          </m.div>

          {/* Visualization Side */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
            data-oid="d0.0xn9"
          >
            <div
              className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-orange-500/10 rounded-[3rem] blur-3xl"
              data-oid="r.p0p22"
            />

            <div
              className="relative rounded-[1.5rem] p-6 lg:p-8 border border-black/[0.08] dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl shadow-xl dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)]"
              data-oid="ds:sdwf"
            >
              <div className="flex items-center justify-between mb-6" data-oid="zdj2kq:">
                <div data-oid="xp2d-:z">
                  <h3 className="text-xl font-black text-foreground" data-oid="r:0leqq">
                    Feedback Loop
                  </h3>
                  <p
                    className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1"
                    data-oid="vd5u-v1"
                  >
                    Real-time comparison
                  </p>
                </div>
                <div className="flex gap-2" data-oid="9mprjnb">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-widest py-1"
                    data-oid="akrl.da"
                  >
                    Manual
                  </Badge>
                  <Badge
                    className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3"
                    data-oid="ev-v1o9"
                  >
                    AI Pro
                  </Badge>
                </div>
              </div>

              <div className="space-y-6" data-oid=":l1l831">
                {/* Comparison 1 */}
                <div className="relative" data-oid="5hscodw">
                  <div className="flex items-center gap-2 mb-4" data-oid="472lyq8">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" data-oid="89_rma2" />
                    <span
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                      data-oid=":7dh1lj"
                    >
                      Lexical Resource
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="b-dcjld">
                    <m.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-muted/40 dark:bg-zinc-900/40 p-4 rounded-xl border border-border/40 dark:border-white/5"
                      data-oid="ej2h:j1"
                    >
                      <p
                        className="text-xs font-bold text-muted-foreground/60 dark:text-gray-500 mb-2 font-mono"
                        data-oid="mnwrym4"
                      >
                        HUMAN TUTOR
                      </p>
                      <p
                        className="text-sm font-medium text-muted-foreground dark:text-gray-400 italic leading-relaxed"
                        data-oid="gf7s.5h"
                      >
                        "Your vocabulary is okay. Try using more advanced words."
                      </p>
                    </m.div>
                    <m.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-primary/5 dark:bg-blue-600/10 p-4 rounded-xl border border-primary/20 dark:border-blue-500/20 shadow-lg dark:shadow-blue-500/5 relative overflow-hidden"
                      data-oid="n--u8nw"
                    >
                      <div className="flex items-center gap-1.5 mb-2" data-oid="_toc.p.">
                        <p
                          className="text-xs font-black text-primary dark:text-blue-400 font-mono select-none"
                          data-oid="wfv.0d9"
                        >
                          IELTS AI PRO
                        </p>
                        <Sparkles
                          className="h-3 w-3 text-primary dark:text-blue-400 animate-pulse"
                          data-oid="con4902"
                        />
                      </div>
                      <p
                        className="text-sm font-black text-foreground dark:text-white leading-relaxed"
                        data-oid="ok80tiq"
                      >
                        <span
                          className="text-primary dark:text-blue-400 truncate block mb-1 font-bold italic"
                          data-oid="hj-55e8"
                        >
                          Suggestion:
                        </span>
                        Replace{' '}
                        <span
                          className="text-red-500 line-through decoration-2 opacity-70"
                          data-oid="hvp3nia"
                        >
                          "bad"
                        </span>{' '}
                        with{' '}
                        <span
                          className="text-primary dark:text-blue-300 underline decoration-2 underline-offset-4"
                          data-oid="a8:6c3z"
                        >
                          "detrimental"
                        </span>{' '}
                        to improve lexical range.
                      </p>
                    </m.div>
                  </div>
                </div>

                {/* Comparison 2 */}
                <div className="relative" data-oid="7h6xl2-">
                  <div className="flex items-center gap-2 mb-4" data-oid="4hzyks8">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" data-oid="gbt_:fd" />
                    <span
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                      data-oid="vpzqh6n"
                    >
                      Pronunciation
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="53jhppt">
                    <m.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-muted/40 dark:bg-zinc-900/40 p-4 rounded-xl border border-border/40 dark:border-white/5"
                      data-oid="_tduw3."
                    >
                      <p
                        className="text-xs font-bold text-muted-foreground/60 dark:text-gray-500 mb-2 font-mono"
                        data-oid="m:rmco1"
                      >
                        HUMAN TUTOR
                      </p>
                      <p
                        className="text-sm font-medium text-muted-foreground dark:text-gray-400 italic leading-relaxed"
                        data-oid="rl1-2ei"
                      >
                        "Work on your pronunciation more next time."
                      </p>
                    </m.div>
                    <m.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-primary/5 dark:bg-blue-600/10 p-4 rounded-xl border border-primary/20 dark:border-blue-500/20 shadow-lg dark:shadow-blue-500/5 relative overflow-hidden"
                      data-oid=".d2gf68"
                    >
                      <div className="flex items-center gap-1.5 mb-2" data-oid="x7:g-vr">
                        <p
                          className="text-xs font-black text-primary dark:text-blue-400 font-mono select-none"
                          data-oid="ux4img8"
                        >
                          IELTS AI PRO
                        </p>
                        <Sparkles
                          className="h-3 w-3 text-primary dark:text-blue-400 animate-pulse"
                          data-oid="pmhcb5z"
                        />
                      </div>
                      <p
                        className="text-sm font-black text-foreground dark:text-white leading-relaxed"
                        data-oid="lnwtf:t"
                      >
                        <span
                          className="text-orange-500 dark:text-orange-400 truncate block mb-1 font-bold italic"
                          data-oid="04b7x6l"
                        >
                          Alert:
                        </span>
                        Intonation is flat in questions. Drill{' '}
                        <span
                          className="text-primary dark:text-blue-300 underline decoration-2 underline-offset-4"
                          data-oid="2akt-b-"
                        >
                          Part 3 samples
                        </span>{' '}
                        for tonal variety.
                      </p>
                    </m.div>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
