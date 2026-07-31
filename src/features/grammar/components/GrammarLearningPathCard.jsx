import { ArrowRight, ClipboardCheck, Route, Send, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { IconChip, PANEL } from '@/features/dashboard/components/primitives';

const surface = PANEL;

// ---------------------------------------------------------------------------
// PathStage — a single step button in the learning path row
// ---------------------------------------------------------------------------
function PathStage({ icon: Icon, label, active, disabled, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'step' : undefined}
      whileHover={disabled ? {} : { y: -3, scale: 1.06 }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="relative flex items-center justify-center">
        {active && (
          <motion.span
            layoutId="pathStageActiveGlow"
            className="absolute -inset-1.5 rounded-2xl bg-[#5a63df]/15 blur-sm dark:bg-indigo-400/25"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />
        )}
        <span
          className={cn(
            'relative flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-200',
            active
              ? 'border-[#5a63df] bg-[#5a63df]/10 text-[#5a63df] ring-4 ring-[#5a63df]/15 dark:border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-300'
              : 'border-[#e2e5f2] bg-white text-slate-400 group-hover:border-[#c9cdf3] group-hover:text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
          )}
        >
          <Icon
            className={cn('h-5 w-5 transition-transform duration-200', active && 'scale-110')}
          />
        </span>
      </div>
      <span
        className={cn(
          'text-[11px] font-extrabold transition-colors duration-200',
          active ? 'text-[#5a63df] dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// GrammarLearningPathCard — aside card with Diagnose/Practise/Apply stages.
// Extracted to its own file to resolve cc=12 warning on GrammarDashboard.
// ---------------------------------------------------------------------------
export default function GrammarLearningPathCard({
  activePathStage,
  pathStatus,
  isStarting,
  isResuming,
  inProgressAttempt,
  access,
  dailyLimitReached,
  onStartPathStage,
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(surface, 'relative overflow-hidden p-4 sm:p-5')}
      aria-labelledby="grammar-path-title"
    >
      <motion.div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#5a63df]/10 blur-2xl dark:bg-indigo-900/30"
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex items-start gap-3">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        >
          <IconChip icon={Route} size="lg" />
        </motion.div>
        <div>
          <h2
            id="grammar-path-title"
            className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Grammar Learning Path
          </h2>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Build accuracy, then use it in IELTS.
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-start">
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-[22px] overflow-hidden">
          <span className="block w-full border-t-2 border-dashed border-[#e2e5f2] dark:border-white/15" />
          <motion.span
            className="absolute top-0 left-0 h-[2px] w-1/3 bg-gradient-to-r from-transparent via-[#5a63df] to-transparent dark:via-indigo-400"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <PathStage
          icon={ClipboardCheck}
          label="Diagnose"
          active={activePathStage === 'diagnose'}
          onClick={() => onStartPathStage('diagnose')}
          disabled={
            isStarting ||
            isResuming ||
            (inProgressAttempt && inProgressAttempt.mode !== 'diagnostic') ||
            (!inProgressAttempt && !access.diagnosticAvailable)
          }
        />
        <PathStage
          icon={Wrench}
          label="Practise"
          active={activePathStage === 'practice'}
          onClick={() => onStartPathStage('practice')}
          disabled={
            isStarting ||
            isResuming ||
            (inProgressAttempt && inProgressAttempt.mode === 'diagnostic') ||
            (!inProgressAttempt && dailyLimitReached)
          }
        />
        <PathStage
          icon={Send}
          label="Apply"
          active={activePathStage === 'apply'}
          onClick={() => onStartPathStage('apply')}
          disabled={isStarting || isResuming}
        />
      </div>

      <div className="mt-4 flex min-h-[22px] items-center justify-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a63df] opacity-75 dark:bg-indigo-400" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5a63df] dark:bg-indigo-400" />
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={pathStatus}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="text-center text-[11px] font-extrabold text-[#5a63df] dark:text-indigo-300"
          >
            {pathStatus}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
        <Link
          to="/learning-path"
          className="group mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#e2e5f2] bg-white/80 text-xs font-bold text-[#5a63df] transition hover:border-[#c9cdf3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10"
        >
          View AI Learning Path{' '}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.aside>
  );
}
