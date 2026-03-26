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
  ChevronRight,
  ArrowLeft,
  Shield,
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            to={createPageUrl('Dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/[0.08] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2.5 rounded-xl ${feature.bgColor} shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <feature.icon className={`w-5 h-5 ${feature.textColor}`} />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
          transition={{ delay: 0.7 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-slate-900/50 dark:to-purple-950/30 p-6 sm:p-8 text-center"
        >
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[60px]" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              7-DAY MONEY BACK GUARANTEE
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Ready to get your target score?
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl h-12 px-8 font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 border-0"
              >
                <Link to={createPageUrl('Pricing')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans & Pricing
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground rounded-xl h-12 px-6 font-medium text-sm"
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
