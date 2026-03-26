import React from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight, Star } from 'lucide-react';

export default function CTABanner({ handlePrimaryCta, handlePricing, viewport }) {
  return (
    <section className="py-8 md:py-12 relative overflow-hidden bg-background" data-oid="xomhbcx">
      <div className="mx-auto max-w-7xl px-4 relative z-10" data-oid="-2f4mf.">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-zinc-900 dark:bg-card border border-white/10 px-6 py-12 md:px-12 md:py-16 text-center shadow-2xl"
          data-oid="5hdv84j"
        >
          {/* Background Glows */}
          <div className="absolute inset-0 z-0 pointer-events-none" data-oid="uw9mn2l">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-primary/20 blur-[100px] opacity-50 rounded-full"
              data-oid="14_mmce"
            />

            <div
              className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[80px] opacity-30 rounded-full"
              data-oid="o28t5g3"
            />
          </div>

          <div className="relative z-10 mx-auto" data-oid="si6-4_1">
            {/* Trust Badge with Real Avatars */}
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm shadow-inner shadow-white/5"
              data-oid=":vlgst2"
            >
              <div className="flex -space-x-2" data-oid="37:ikkt">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full ring-2 ring-zinc-900 bg-zinc-800 overflow-hidden"
                    data-oid="xpmxja."
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="IELTS AI Pro Learner"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      width="24"
                      height="24"
                      data-oid="ud81c:q"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2" data-oid=".006gft">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-200"
                  data-oid="3-:1r1-"
                >
                  Trusted by IELTS learners worldwide
                </span>
                <div className="flex gap-0.5" data-oid="4v.9kzy">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-2.5 w-2.5 fill-primary text-primary"
                      data-oid="9jv.w-h"
                    />
                  ))}
                </div>
              </div>
            </m.div>

            {/* Main Heading */}
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]"
              data-oid="0kzghms"
            >
              Stop guessing. <br data-oid=":ya6rnp" />
              <span className="text-primary" data-oid="nlu4yvx">
                Start succeeding.
              </span>
            </h2>

            <p
              className="text-sm md:text-base font-medium text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed"
              data-oid="5m2ux0z"
            >
              Get AI-driven IELTS feedback, real-time analytics, and a study plan that targets your
              band score goals.
            </p>

            {/* Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm mx-auto sm:max-w-none"
              data-oid="hi1abu7"
            >
              <Button
                className="h-11 px-8 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 w-full sm:w-auto transition-all hover:scale-105"
                onClick={handlePrimaryCta}
                data-oid="cxluzm."
              >
                Try Free Now <ArrowRight className="ml-2 h-4 w-4" data-oid="58e6qbc" />
              </Button>
              <Button
                variant="secondary"
                className="h-11 px-8 rounded-xl font-bold text-sm bg-white text-zinc-900 hover:bg-zinc-100 w-full sm:w-auto transition-all hover:scale-105"
                onClick={handlePricing}
                data-oid="v.4.7oa"
              >
                Explore IELTS Plans{' '}
                <ChevronRight className="ml-1 h-4 w-4 text-zinc-400" data-oid="c6_53h2" />
              </Button>
            </div>

            <p
              className="mt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400"
              data-oid="xglwxaj"
            >
              Free Band Assessment · No Credit Card Required
            </p>
          </div>
        </m.div>
      </div>
    </section>
  );
}
