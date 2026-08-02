import React from 'react';
import { m } from 'framer-motion';
import {
  Video,
  MessageSquare,
  Crown,
  Globe,
  Zap,
  ArrowRight,
  Trophy,
  Clock,
  Lock,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

const FEATURES = [
  {
    icon: Video,
    title: 'Live video practice',
    desc: 'Face-to-face rooms for speaking.',
    tag: 'Audio & video',
  },
  {
    icon: MessageSquare,
    title: 'Direct feedback',
    desc: 'Peer reviews on your writing tasks.',
    tag: 'Peer evaluation',
  },
  {
    icon: Trophy,
    title: 'Group missions',
    desc: 'Team challenges and joint rewards.',
    tag: 'XP multiplier',
  },
  {
    icon: Bot,
    title: 'AI moderation',
    desc: 'Focused and productive study sessions.',
    tag: '24/7 AI agent',
  },
];

const MODULE_ICON = { Writing: PenTool, Speaking: Mic, Reading: BookOpen, Listening: Headphones };
const MODULE_TONE = { Writing: 'accent', Speaking: 'emerald', Reading: 'rose', Listening: 'amber' };

const HOW_IT_WORKS = [
  { step: '01', title: 'Pick a topic', desc: 'Reading, writing, speaking or listening.' },
  { step: '02', title: 'Find your team', desc: 'Join or create rooms with specific needs.' },
  { step: '03', title: 'Start simulation', desc: 'Sync testing or open-ended practice.' },
  { step: '04', title: 'Progress together', desc: 'Earn shared XP and group badges.' },
];

const PREVIEWS = [
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

function FeatureTile({ icon: Icon, title, desc, tag }) {
  return (
    <div className={cn(TILE, 'flex flex-col gap-2 p-3')}>
      <div className="flex items-center justify-between">
        <IconChip icon={Icon} />
        <Pill tone="neutral">{tag}</Pill>
      </div>
      <div>
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{title}</h4>
        <p className={cn('mt-0.5 text-[11px] font-medium leading-tight', MUTED)}>{desc}</p>
      </div>
    </div>
  );
}

function GroupPreviewCard({ name, members, type, difficulty, isFull }) {
  const Icon = MODULE_ICON[type] || PenTool;
  const tone = MODULE_TONE[type] || 'accent';

  return (
    <div className={cn(TILE, 'group flex flex-col justify-between gap-3 p-4')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconChip icon={Icon} tone={tone} />
          <Pill tone={tone}>{type}</Pill>
        </div>
        <div className="flex items-center -space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <img
              key={i}
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${i}`}
              className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 object-cover dark:border-[#131315] dark:bg-slate-800"
              alt=""
            />
          ))}
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#5a63df] text-[9px] font-black text-white dark:border-[#131315]">
            +{members}
          </div>
        </div>
      </div>

      <div>
        <h4 className="flex items-center justify-between text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
          <span className="truncate">{name}</span>
          <ArrowRight className="ml-1 h-4 w-4 shrink-0 -translate-x-2 text-[#5a63df] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        </h4>
        <div className="mt-1 flex items-center gap-1.5">
          <Pill tone="neutral">{difficulty}</Pill>
          <span className={cn('text-[10px] font-semibold', MUTED)}>· {members} members</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#eeedf7] pt-2.5 dark:border-white/[0.07]">
        <Pill tone={isFull ? 'neutral' : 'ok'}>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isFull ? 'bg-slate-400' : 'bg-[rgb(var(--signal-ok))]'
            )}
          />
          {isFull ? 'Room full' : 'Live practice'}
        </Pill>
        <Pill tone={isFull ? 'neutral' : 'accent'}>
          <Lock className="h-2.5 w-2.5" />
          {isFull ? 'View info' : 'Pro preview'}
        </Pill>
      </div>
    </div>
  );
}

export default function StudyGroups() {
  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1200px] space-y-3"
      >
        <m.header
          variants={FADE_UP}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Study groups
              </h1>
              <Pill tone="accent">Peer community</Pill>
            </div>
            <p className={cn('mt-0.5 text-sm font-medium', MUTED)}>
              Collaborative practice rooms & live peer learning communities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(TILE, 'flex items-center gap-2 px-3 py-1.5')}>
              <IconChip icon={Globe} tone="emerald" size="sm" />
              <div>
                <p className="text-xs font-extrabold leading-none text-slate-900 dark:text-white">
                  Global
                </p>
                <p className={cn(MICRO, MUTED, 'mt-0.5')}>Network</p>
              </div>
            </div>
            <div className={cn(TILE, 'flex items-center gap-2 px-3 py-1.5')}>
              <IconChip icon={Zap} tone="amber" size="sm" />
              <div>
                <p className="text-xs font-extrabold leading-none text-slate-900 dark:text-white">
                  Real-time
                </p>
                <p className={cn(MICRO, MUTED, 'mt-0.5')}>Live rooms</p>
              </div>
            </div>
          </div>
        </m.header>

        <div className="grid gap-3 lg:grid-cols-12 lg:items-start">
          <div className="space-y-3 lg:col-span-8">
            <m.div variants={FADE_UP} className={cn(PANEL, 'p-4 sm:p-5')}>
              <div className="flex items-center justify-between">
                <Pill tone="accent">
                  <Clock className="h-3 w-3" />
                  Launching next quarter
                </Pill>
              </div>

              <h2 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                Connect, collaborate, and conquer.
              </h2>
              <p className={cn('mt-1 max-w-xl text-[13px] font-medium leading-relaxed', MUTED)}>
                A state-of-the-art virtual simulation environment. Join specialized rooms to
                practice with peers at your level.
              </p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <FeatureTile key={f.title} {...f} />
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#eeedf7] pt-3.5 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
                <button
                  disabled
                  className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white opacity-70"
                >
                  Coming soon
                </button>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Exclusive to Pro & Premium members
                </div>
              </div>
            </m.div>

            <m.div variants={FADE_UP} className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Active rooms preview
                </h3>
                <Pill tone="neutral">Real-time status</Pill>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PREVIEWS.map((preview) => (
                  <GroupPreviewCard key={preview.name} {...preview} />
                ))}
              </div>
            </m.div>
          </div>

          <m.div variants={FADE_UP} className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-4')}>
            <div className="border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                How it works
              </h3>
              <p className={cn('mt-0.5 text-xs font-medium', MUTED)}>
                Four simple steps to IELTS group mastery.
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className={cn('shrink-0 text-lg font-black italic text-[#5a63df]/70')}>
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className={cn('mt-0.5 text-[11px] font-medium leading-relaxed', MUTED)}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={cn(
                TILE,
                'mt-4 border-amber-200/60 bg-amber-50/40 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.06]'
              )}
            >
              <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-300">
                <strong>Pro tip:</strong> Group study increases retention rates and practice
                consistency by up to 45%.
              </p>
            </div>
          </m.div>
        </div>
      </m.div>
    </main>
  );
}
