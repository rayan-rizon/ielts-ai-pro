import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SidebarPracticeCard = ({
  title = 'Ready to put your knowledge into action?',
  subtitle = 'Take a practice test and see where you stand.',
  actionLabel = 'Start Free Test',
  actionPath = '/signup',
}) => {
  return (
    <motion.div
      whileHover="hover"
      initial="initial"
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#5A5BF5] via-[#7D70F7] to-[#A78BFA] p-6 text-white shadow-xl shadow-indigo-500/20"
      variants={{
        initial: { y: 0, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.2)' },
        hover: { y: -4, boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.4)' },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      data-oid="sidebar-practice-card"
    >
      {/* Background Star Sparkles */}
      <motion.div
        className="absolute right-[48px] top-[24px] z-10 pointer-events-none opacity-90"
        animate={{ y: [0, -4, 0], rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[#A2E9FF] drop-shadow-[0_0_6px_rgba(162,233,255,0.6)]"
        >
          <path
            d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>
      <motion.div
        className="absolute right-[22px] top-[48px] z-10 pointer-events-none opacity-80"
        animate={{ y: [0, 3, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[#A2E9FF] drop-shadow-[0_0_4px_rgba(162,233,255,0.4)]"
        >
          <path
            d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* Grid Layout to align Text Content and Mockup Visual side-by-side */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        {/* Left Column: Text & Button */}
        <div className="relative z-10 flex flex-col items-start pr-1">
          <h2 className="text-lg sm:text-xl font-extrabold leading-snug tracking-[-0.035em] text-white">
            {title}
          </h2>
          <p className="mt-2 text-[11px] sm:text-xs leading-relaxed text-indigo-50/90 font-medium max-w-[170px]">
            {subtitle}
          </p>
          <Button
            asChild
            className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#3B2E9B] shadow-md shadow-black/5 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group shrink-0"
          >
            <Link to={actionPath} className="inline-flex items-center gap-1">
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Right Column: 3D Hand + Mockup Card */}
        <div className="relative w-[105px] h-[140px] shrink-0 self-end pointer-events-none select-none">
          {/* White Card Mockup */}
          <motion.div
            className="absolute right-[-12px] bottom-[-20px] w-[105px] h-[135px] bg-white dark:bg-white/95 rounded-[18px] p-3 shadow-[0_15px_30px_rgba(0,0,0,0.18)] border border-white/50 flex flex-col justify-between"
            variants={{
              initial: { rotate: 8, x: 0, y: 0 },
              hover: { rotate: 6, x: -2, y: -2 },
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Header capsule inside mockup */}
            <div className="h-1.5 w-7 bg-slate-100 rounded-full" />

            {/* Score Text */}
            <div className="my-auto pt-1">
              <div className="text-2xl font-black tracking-tight text-slate-800 leading-none">
                7.5
              </div>
              <div className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                Overall Band
              </div>
            </div>

            {/* Micro Chart (Lilac/Grey vertical bars) */}
            <div className="flex items-end justify-between gap-[2px] h-8 pt-0.5">
              <div className="w-[5px] h-[40%] bg-[#E0E2FF] rounded-full" />
              <div className="w-[5px] h-[60%] bg-[#E0E2FF] rounded-full" />
              <div className="w-[5px] h-[50%] bg-[#E0E2FF] rounded-full" />
              <div className="w-[5px] h-[85%] bg-[#C9CCFF] rounded-full" />
              <div className="w-[5px] h-[70%] bg-[#E0E2FF] rounded-full" />
              <div className="w-[5px] h-[95%] bg-[#C9CCFF] rounded-full" />
            </div>

            {/* Fingers overlaying the card to simulate holding it with claymorphic shading */}
            {/* Left Fingers */}
            <div className="absolute -left-[5px] top-[40px] w-[9px] h-[18px] rounded-full bg-gradient-to-r from-slate-100 to-white shadow-[inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.06),1px_1.5px_4px_rgba(0,0,0,0.08)] z-20" />
            <div className="absolute -left-[6px] top-[60px] w-[9px] h-[18px] rounded-full bg-gradient-to-r from-slate-100 to-white shadow-[inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.06),1px_1.5px_4px_rgba(0,0,0,0.08)] z-20" />
            <div className="absolute -left-[7px] top-[80px] w-[9px] h-[18px] rounded-full bg-gradient-to-r from-slate-100 to-white shadow-[inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.06),1px_1.5px_4px_rgba(0,0,0,0.08)] z-20" />

            {/* Right Thumb overlay */}
            <div className="absolute -right-[4px] top-[45px] w-[9px] h-[18px] rounded-full bg-gradient-to-l from-slate-100 to-white shadow-[inset_1.5px_-1.5px_3px_rgba(0,0,0,0.06),-1px_1.5px_4px_rgba(0,0,0,0.08)] z-20" />

            {/* Palm/Wrist coming up from bottom-left */}
            <div className="absolute -left-[14px] top-[95px] w-8 h-12 rounded-t-xl rounded-b-lg bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.05),1px_2px_6px_rgba(0,0,0,0.08)] z-10 rotate-[-12deg]" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
