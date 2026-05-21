import { motion } from 'framer-motion';
import { Brain, Award, Zap, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export function AuthLeftPanel() {
  const features = [
    {
      icon: Award,
      title: 'Band 8.5+',
      desc: 'Targeted strategies',
      color: 'from-blue-500/10 to-blue-600/5',
      iconColor: 'text-blue-400',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      desc: 'AI-powered scoring',
      color: 'from-amber-500/10 to-amber-600/5',
      iconColor: 'text-amber-400',
    },
    {
      icon: Globe,
      title: '50k+ Students',
      desc: 'Verified success',
      color: 'from-emerald-500/10 to-emerald-600/5',
      iconColor: 'text-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Official Tests',
      desc: 'Cambridge material',
      color: 'from-indigo-500/10 to-indigo-600/5',
      iconColor: 'text-indigo-400',
    },
  ];

  return (
    <motion.div
      className="hidden lg:flex flex-col h-full bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-12 lg:col-span-3 justify-between relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full" />

      <div className="space-y-10 relative z-20">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-4"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 border border-white/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            IELTS <span className="text-blue-400">Ai</span> Pro
          </span>
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-white leading-[1.1]">
            Master the IELTS with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 animate-gradient text-glow-indigo">
              Advanced AI Insights
            </span>
          </h1>
          <p className="text-lg text-slate-300/90 max-w-md leading-relaxed font-medium">
            The most advanced AI preparation platform. Get band scores, feedback, and study plans
            tailored for your success.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {features.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={cn(
                'flex items-start space-x-3 p-5 rounded-2xl bg-gradient-to-br border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-default',
                item.color
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors',
                  item.iconColor
                )}
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">{item.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social Proof Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center space-x-6 pt-8 border-t border-white/10"
      >
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/100?img=${i + 20}`}
              alt="student avatar"
              className="w-11 h-11 rounded-full border-2 border-[#1e1b4b] ring-2 ring-blue-500/20 shadow-xl"
            />
          ))}
          <div className="w-11 h-11 rounded-full border-2 border-[#1e1b4b] bg-blue-600 flex items-center justify-center text-[10px] font-black text-white ring-2 ring-blue-500/20">
            +15k
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-white font-bold text-sm tracking-wide">Trusted worldwide</p>
          <div className="flex items-center text-slate-400 text-[11px] font-semibold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Live: <span className="text-white ml-1">1,248 active</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
