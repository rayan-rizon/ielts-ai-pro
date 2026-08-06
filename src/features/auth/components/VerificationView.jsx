import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ShieldCheck,
  Zap,
  ChevronRight,
  Loader2,
  User as UserIcon,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export function VerificationView({
  email,
  onResend,
  onEdit,
  onBackToSignIn,
  isResending,
  info,
  resendTimer,
}) {
  return (
    <motion.div
      key="verification"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
      data-oid="v-view"
    >
      <div className="space-y-3 text-center">
        {/* Animated Icon Container */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
            className="absolute inset-0 rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/6"
          />

          <motion.div
            animate={{ y: [0, -4, 0], rotate: [0, -2, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <Mail className="h-8 w-8 text-slate-700 dark:text-slate-200" />
          </motion.div>
        </div>

        <div className="space-y-1.5">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Check your inbox
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm leading-relaxed text-slate-500 dark:text-slate-400"
          >
            We've sent a verification link to <br />
            <span className="break-all rounded-md border border-[#e4e2f0] bg-[#f4f3fb] px-1.5 py-0.5 font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-50">
              {email}
            </span>
          </motion.p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {info && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 text-[12px] font-semibold text-emerald-900 dark:border-emerald-800/30 dark:bg-emerald-500/8 dark:text-emerald-100"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="leading-relaxed">{info}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2.5 pt-1">
        <Button
          onClick={onResend}
          disabled={isResending || resendTimer > 0}
          className="h-10 w-full rounded-lg bg-slate-900 text-sm font-bold text-white transition-colors hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : resendTimer > 0 ? (
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Resend in {resendTimer}s
            </span>
          ) : (
            <span className="group flex items-center gap-1.5">
              Resend link
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onEdit}
          className={cn(
            'flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-bold text-slate-500 transition-colors',
            'hover:bg-[#f7f6fd] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100'
          )}
        >
          <UserIcon className="h-3.5 w-3.5" />
          Wrong email? Edit details
        </Button>
      </div>

      <div className="border-t border-[#ebeaf7] pt-5 text-center dark:border-white/[0.07]">
        <button
          onClick={onBackToSignIn}
          className="group inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to sign in
        </button>
      </div>
    </motion.div>
  );
}
