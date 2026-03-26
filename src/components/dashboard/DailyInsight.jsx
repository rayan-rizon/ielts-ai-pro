import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, Target } from 'lucide-react';

const insights = [
  {
    icon: Sparkles,
    title: 'Word of the Day',
    content: 'Punctilious (adj.) - showing great attention to detail or correct behavior.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Lightbulb,
    title: 'Listening Tip',
    content:
      "Pay attention to 'signposting' words like 'however', 'finally', or 'consequently' to follow the speaker's logic.",
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Target,
    title: 'Quick Fact',
    content:
      'Consistency is key. 15 minutes of practice every day is better than a 3-hour session once a week.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

const DailyInsight = () => {
  const insight = insights[Math.floor(Math.random() * insights.length)];
  const Icon = insight.icon;

  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} className="h-full" data-oid="y3:o:jt">
      <div
        className="p-8 rounded-3xl bg-indigo-600 text-white relative h-full overflow-hidden group shadow-2xl shadow-indigo-500/20"
        data-oid="ch5xj7l"
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="ig4wnvb"
        />

        <div
          className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700 pointer-events-none"
          data-oid="ygiad52"
        />

        <div className="relative flex flex-col h-full z-10" data-oid="6:t2r2k">
          <div className="flex items-center justify-between mb-6" data-oid="0dc135q">
            <div
              className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl transform group-hover:rotate-12 transition-transform duration-500"
              data-oid="1f-wfkn"
            >
              <Icon className="w-6 h-6 text-white" data-oid="iu_etai" />
            </div>
            <div
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full"
              data-oid="2hx0b03"
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                data-oid="6to7tc0"
              />

              <span
                className="text-[10px] font-black tracking-widest text-white uppercase leading-none"
                data-oid="ezzgjmp"
              >
                Live Insight
              </span>
            </div>
          </div>

          <div className="space-y-3" data-oid="bcijcg7">
            <h4
              className="text-[10px] font-black tracking-[0.2em] text-white/70 uppercase leading-none"
              data-oid=".r36zdp"
            >
              {insight.title}
            </h4>
            <p
              className="text-xl font-black text-white leading-tight tracking-tight"
              data-oid="m-.i99d"
            >
              "{insight.content}"
            </p>
          </div>

          <div
            className="mt-auto pt-6 flex items-center justify-between opacity-60"
            data-oid=".yx6roh"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest" data-oid="s7b804h">
              Powered by AI
            </span>
            <Sparkles className="w-3.5 h-3.5" data-oid="1jt-7lf" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyInsight;
