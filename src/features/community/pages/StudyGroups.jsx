import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Video,
  MessageSquare,
  Crown,
  Sparkles,
  Globe,
  Zap,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Rocket,
  Clock,
  Lock,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

// Standardized App Page Header
const PageHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10 mb-5"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-sm">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Groups
          </h1>
          <Badge className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-md font-semibold text-xs uppercase tracking-wider">
            Peer Community
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Collaborative practice rooms & live peer learning communities.
        </p>
      </div>
    </div>

    {/* Metadata Pills */}
    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
      <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-2xs">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
            Global
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Network
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-2xs">
        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
            Real-time
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Live Rooms
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

const FeatureHighlight = ({ icon: Icon, title, desc, tag, color }) => {
  const colorMap = {
    blue: {
      icon: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      hover: 'hover:border-blue-400 dark:hover:border-blue-500/40',
    },
    indigo: {
      icon: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      hover: 'hover:border-indigo-400 dark:hover:border-indigo-500/40',
    },
    purple: {
      icon: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      hover: 'hover:border-purple-400 dark:hover:border-purple-500/40',
    },
    rose: {
      icon: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      hover: 'hover:border-rose-400 dark:hover:border-rose-500/40',
    },
  };

  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={cn(
        'group flex flex-col justify-between p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
        theme.hover
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs',
              theme.icon
            )}
          >
            <Icon className="w-4 h-4" />
          </div>

          {tag && (
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] font-extrabold uppercase px-1.5 py-0 rounded-md border',
                theme.badge
              )}
            >
              {tag}
            </Badge>
          )}
        </div>

        <div className="space-y-0.5">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
};

const GroupPreviewCard = ({ name, members, type, difficulty, isFull }) => {
  const themes = {
    Writing: {
      icon: PenTool,
      badge:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
      iconBg:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/50 dark:hover:border-indigo-500/50',
    },
    Speaking: {
      icon: Mic,
      badge:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
      iconBg:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/50',
    },
    Reading: {
      icon: BookOpen,
      badge:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
      iconBg:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
      hoverBorder: 'hover:border-rose-500/50 dark:hover:border-rose-500/50',
    },
    Listening: {
      icon: Headphones,
      badge:
        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
      iconBg:
        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/50 dark:hover:border-amber-500/50',
    },
  };

  const theme = themes[type] || themes.Writing;
  const Icon = theme.icon;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden',
        theme.hoverBorder
      )}
    >
      <div className="space-y-3">
        {/* Header Row: Skill Icon + Member Avatars */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                theme.iconBg
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-extrabold px-2 py-0.5 rounded-lg border',
                theme.badge
              )}
            >
              {type}
            </Badge>
          </div>

          {/* Participant Avatars */}
          <div className="flex items-center -space-x-2">
            {[...Array(3)].map((_, i) => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${i}`}
                className="w-6.5 h-6.5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 object-cover shadow-2xs"
                alt="Participant"
              />
            ))}
            <div className="w-6.5 h-6.5 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 text-white font-extrabold text-[9px] flex items-center justify-center shadow-2xs">
              +{members}
            </div>
          </div>
        </div>

        {/* Title & Difficulty */}
        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
            <span className="truncate">{name}</span>
            <ArrowRight className="w-4 h-4 text-indigo-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0 ml-1" />
          </h4>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[9px] font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-0 uppercase"
            >
              {difficulty}
            </Badge>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              • {members} Active Members
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Status Pill & Action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-3 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isFull
                ? 'bg-slate-300 dark:bg-slate-600'
                : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
            )}
          />
          <span className={isFull ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}>
            {isFull ? 'Room Full' : 'Live Practice'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
          <span>{isFull ? 'View Info' : 'Pro Preview'}</span>
          <Lock className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};

export default function StudyGroups() {
  const previews = [
    {
      name: 'Evening Writing Mastery',
      members: 8,
      type: 'Writing',
      difficulty: 'Academic',
      isFull: false,
    },
    {
      name: 'Speaking Club: Fluency Focus',
      members: 5,
      type: 'Speaking',
      difficulty: 'General',
      isFull: false,
    },
    {
      name: 'Intensive Reading Lab',
      members: 12,
      type: 'Reading',
      difficulty: 'Academic',
      isFull: true,
    },
    {
      name: 'Listening & Vocab Sync',
      members: 4,
      type: 'Listening',
      difficulty: 'Advanced',
      isFull: false,
    },
  ];

  return (
    <div className="relative min-h-screen pb-16 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans">
      {/* Background Gradient & Subtle Grid */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[45rem] h-[45rem] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5 relative z-10"
      >
        <PageHeader />

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* Left Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Hero Main Section Card (Reduced Height) */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 backdrop-blur-2xl p-5 sm:p-6 space-y-4 shadow-md shadow-indigo-500/5">
              {/* Subtle Ambient Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl pointer-events-none -z-10" />

              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Launching Next Quarter</span>
                </Badge>
                <ShieldCheck className="w-5 h-5 text-indigo-500/50" />
              </div>

              <div className="space-y-1 max-w-xl">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Connect, Collaborate, and{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
                    Conquer.
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  A state-of-the-art virtual simulation environment. Join specialized rooms to
                  practice with peers at your level.
                </p>
              </div>

              {/* 4 Compact Feature Cards */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <FeatureHighlight
                  icon={Video}
                  title="Live Video Practice"
                  desc="Face-to-face practice rooms for speaking."
                  tag="Audio & Video"
                  color="blue"
                />
                <FeatureHighlight
                  icon={MessageSquare}
                  title="Direct Feedback"
                  desc="Peer reviews on your writing tasks."
                  tag="Peer Evaluation"
                  color="indigo"
                />
                <FeatureHighlight
                  icon={Trophy}
                  title="Group Missions"
                  desc="Team challenges and joint rewards."
                  tag="XP Multiplier"
                  color="purple"
                />
                <FeatureHighlight
                  icon={Bot}
                  title="AI Moderation"
                  desc="Focused and productive study sessions."
                  tag="24/7 AI Agent"
                  color="rose"
                />
              </div>

              {/* Action Button & Disclaimer */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <Button
                  disabled
                  className="rounded-xl px-5 h-9 font-bold text-xs bg-indigo-600 opacity-80 text-white cursor-not-allowed shadow-xs border-0"
                >
                  Coming Soon
                </Button>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Exclusive to Pro & Premium Members</span>
                </div>
              </div>
            </div>

            {/* Active Rooms Preview Grid */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Active Rooms Preview
                </h3>
                <Badge
                  variant="outline"
                  className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase"
                >
                  Real-time Status
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {previews.map((preview, i) => (
                  <GroupPreviewCard key={i} {...preview} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 cols) - How It Works */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm p-5 sm:p-6 space-y-5">
              <div className="space-y-1 border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                  How it works
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Four simple steps to IELTS group mastery.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'Pick a Topic',
                    desc: 'Reading, Writing, Speaking or Listening.',
                    color: 'text-indigo-600 dark:text-indigo-400',
                  },
                  {
                    step: '02',
                    title: 'Find your Team',
                    desc: 'Join or create rooms with specific needs.',
                    color: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    step: '03',
                    title: 'Start Simulation',
                    desc: 'Sync testing or open-ended practice.',
                    color: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    step: '04',
                    title: 'Progress Together',
                    desc: 'Earn shared XP and group badges.',
                    color: 'text-rose-600 dark:text-rose-400',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group/item">
                    <span
                      className={cn(
                        'text-xl sm:text-2xl font-black italic leading-none shrink-0 opacity-80',
                        item.color
                      )}
                    >
                      {item.step}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight uppercase">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro Tip Box */}
              <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-3.5 border border-amber-200/80 dark:border-amber-900/50">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>PRO TIP:</strong> Group study increases retention rates and practice
                  consistency by up to 45%.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
