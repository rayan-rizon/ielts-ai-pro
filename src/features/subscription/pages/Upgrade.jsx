import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown,
  Sparkles,
  Zap,
  BookOpen,
  Mic,
  PenTool,
  Brain,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const features = [
  {
    icon: PenTool,
    title: 'AI Writing Evaluations',
    description: 'Get unlimited detailed band-score feedback on your essays',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Mic,
    title: 'AI Speaking Practice',
    description: 'Real-time speaking sessions with instant AI scoring',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Brain,
    title: 'AI Learning Path',
    description: 'Personalized daily study plan optimized for your exam date',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: BookOpen,
    title: 'Cambridge Tests',
    description: 'Full access to official Cambridge IELTS test papers',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
];

const Upgrade = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/4 w-[40rem] h-[40rem] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 right-1/4 w-[40rem] h-[40rem] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex mb-6"
          >
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-500/20">
                <Lock className="w-9 h-9 text-white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Crown className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Unlock{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              Premium Features
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            This feature requires a Pro or Premium subscription. Upgrade to unlock AI-powered tools
            and accelerate your IELTS preparation.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-white/[0.05] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 from-indigo-500 to-purple-500 pointer-events-none" />
              <div className="relative flex items-start gap-5">
                <div
                  className={`p-3.5 rounded-2xl ${feature.bgColor} shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.textColor}`} />
                </div>
                <div className="text-left min-w-0 pt-0.5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-purple-950/40 p-10 text-center shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 backdrop-blur-md"
        >
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[15rem] bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Ready to get your target score?
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl h-14 px-10 font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 border-0"
              >
                <Link to={createPageUrl('Pricing')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans & Pricing
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground rounded-2xl h-14 px-8 font-medium text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Link to={createPageUrl('Dashboard')}>Maybe Later</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Instant access
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                24/7 AI support
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrade;
