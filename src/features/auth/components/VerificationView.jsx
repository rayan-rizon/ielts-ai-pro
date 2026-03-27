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
      className="space-y-8"
      data-oid="v-view"
    >
      <div className="text-center space-y-4">
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
            className="absolute inset-0 bg-blue-500/10 rounded-[2.5rem] border border-blue-500/20 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]"
          />

          <motion.div
            animate={{
              y: [0, -4, 0],
              rotate: [0, -2, 2, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10"
          >
            <Mail className="w-12 h-12 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
          </motion.div>

          {/* Particle Effects */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5],
                x: (i - 1) * 30,
                y: -40 - i * 10,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
              className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full blur-[1px]"
            />
          ))}
        </div>

        <div className="space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Check your inbox
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
          >
            We've sent a verification link to <br />
            <span className="font-bold text-slate-900 dark:text-white break-all px-1.5 py-0.5 rounded-md bg-secondary/50 border border-border/50">
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
            className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black items-start flex gap-3 shadow-lg shadow-emerald-500/5 transition-all duration-300"
          >
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <span className="leading-relaxed tracking-tight">{info}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 pt-2">
        <Button
          onClick={onResend}
          disabled={isResending || resendTimer > 0}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover-lift relative overflow-hidden group transition-all duration-300"
        >
          {isResending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : resendTimer > 0 ? (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-300" />
              Resend in {resendTimer}s
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Resend Link
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}

          {/* Button Shine Effect */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
          />
        </Button>

        <Button
          variant="ghost"
          onClick={onEdit}
          className="w-full h-12 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-secondary/80 dark:hover:bg-zinc-900/80 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <UserIcon className="w-3.5 h-3.5" />
          Wrong email? Edit details
        </Button>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-white/5 text-center">
        <button
          onClick={onBackToSignIn}
          className="group inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Sign In
        </button>
      </div>
    </motion.div>
  );
}
