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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';

// Simplified but premium Header matching the new style
const PageHeader = () => (
  <div
    className="relative group overflow-hidden rounded-3xl p-5 md:p-6 border border-white/40 dark:border-white/5 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-500/5 dark:via-transparent dark:to-purple-500/5 backdrop-blur-3xl shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-500/30 mb-6"
    data-oid="2hr8v.0"
  >
    <div
      className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent -z-10"
      data-oid="degvx_6"
    />

    <div
      className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-400/5 dark:bg-indigo-500/10 rounded-full blur-[60px] -z-10 group-hover:scale-110 transition-transform duration-1000"
      data-oid="n7jqs4a"
    />

    <div
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10"
      data-oid="6836drs"
    >
      <div className="space-y-3 max-w-xl" data-oid="neo4dzu">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-600/5 dark:bg-indigo-400/10 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
          data-oid="x5-mb6l"
        >
          <Users className="w-2.5 h-2.5" data-oid="jes02ei" />
          <span data-oid="acac:3k">Peer Learning Community</span>
        </motion.div>

        <div className="space-y-1" data-oid="hanw2kt">
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
            data-oid="2hmq46j"
          >
            Study{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400"
              data-oid="ela7tym"
            >
              Groups
            </span>
          </h1>
          <p
            className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold leading-normal max-w-xl"
            data-oid="otg2y49"
          >
            Collaborative practice rooms. Grow together with peers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center" data-oid="q9a1zed">
          <div
            className="flex items-center gap-2 bg-white/70 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-2xl"
            data-oid="rnozed8"
          >
            <div
              className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
              data-oid="4.qyil:"
            >
              <Globe className="w-3.5 h-3.5" data-oid="n0njl6g" />
            </div>
            <div className="flex flex-col" data-oid="oqne4-i">
              <h4
                className="text-[13px] font-black text-slate-900 dark:text-white leading-none"
                data-oid="swqu9m6"
              >
                Global
              </h4>
              <span
                className="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                data-oid="ll:.2iq"
              >
                Network
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 bg-white/70 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm backdrop-blur-2xl"
            data-oid="dwk2ofz"
          >
            <div
              className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"
              data-oid="59mycod"
            >
              <Zap className="w-3.5 h-3.5" data-oid="a:ftobx" />
            </div>
            <div className="flex flex-col" data-oid="x9s_-hr">
              <h4
                className="text-[13px] font-black text-slate-900 dark:text-white leading-none"
                data-oid="-tivxi-"
              >
                Real-time
              </h4>
              <span
                className="text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                data-oid="ol_af.c"
              >
                Live Rooms
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:block hidden" data-oid="2ni0oow">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group/rocket"
          data-oid="epw6sun"
        >
          <div
            className="w-24 h-24 bg-white dark:bg-slate-900/80 backdrop-blur-3xl border border-white dark:border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-center overflow-hidden"
            data-oid="9.3lc-9"
          >
            <Rocket
              className="w-12 h-12 text-indigo-500 group-hover/rocket:scale-110 group-hover/rocket:-translate-y-1 transition-all duration-500"
              data-oid="rrisz.."
            />
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);

const FeatureHighlight = ({ icon: Icon, title, desc, color }) => {
  const colorMap = {
    blue: 'bg-blue-600 text-white shadow-blue-500/30',
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/30',
    purple: 'bg-purple-600 text-white shadow-purple-500/30',
    rose: 'bg-rose-600 text-white shadow-rose-500/30',
  };

  return (
    <div
      className="flex gap-3 p-3.5 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 backdrop-blur-md transition-all hover:bg-white/80 dark:hover:bg-slate-900/60 hover:shadow-xl hover:shadow-indigo-500/5 group text-slate-900 dark:text-white"
      data-oid="dywn0mz"
    >
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110',
          colorMap[color] || colorMap.indigo
        )}
        data-oid="1t039kj"
      >
        <Icon className="w-4 h-4 stroke-[2.5px]" data-oid="24xi49f" />
      </div>
      <div className="space-y-0.5" data-oid="ejjl1n2">
        <h4 className="font-extrabold text-[13px] uppercase tracking-tight" data-oid="8-707pq">
          {title}
        </h4>
        <p
          className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight"
          data-oid="qmbm4xe"
        >
          {desc}
        </p>
      </div>
    </div>
  );
};

const GroupPreviewCard = ({ name, members, type, difficulty, isFull }) => {
  const gradients = {
    Writing:
      'from-blue-600/20 via-transparent to-indigo-600/10 dark:from-blue-500/20 dark:via-transparent dark:to-indigo-500/10',
    Speaking:
      'from-emerald-600/20 via-transparent to-teal-600/10 dark:from-emerald-500/20 dark:via-transparent dark:to-teal-500/10',
    Reading:
      'from-rose-600/20 via-transparent to-pink-600/10 dark:from-rose-500/20 dark:via-transparent dark:to-pink-500/10',
    Listening:
      'from-amber-600/20 via-transparent to-orange-600/10 dark:from-amber-500/20 dark:via-transparent dark:to-orange-500/10',
  };

  const accentColors = {
    Writing:
      'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/20',
    Speaking:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/20',
    Reading:
      'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/10 border-rose-500/20',
    Listening:
      'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/20',
  };

  const icons = {
    Writing: PenTool,
    Speaking: Mic,
    Reading: BookOpen,
    Listening: Headphones,
  };

  const Icon = icons[type] || Users;

  const hoverShadows = {
    Writing: 'hover:shadow-blue-500/20 hover:border-blue-500/40',
    Speaking: 'hover:shadow-emerald-500/20 hover:border-emerald-500/40',
    Reading: 'hover:shadow-rose-500/20 hover:border-rose-500/40',
    Listening: 'hover:shadow-amber-500/20 hover:border-amber-500/40',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-xl border-slate-200/60 dark:border-white/10 transition-all duration-500',
        'bg-white/40 dark:bg-[#0c0c0e] backdrop-blur-3xl shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]',
        'bg-gradient-to-br',
        gradients[type],
        hoverShadows[type],
        'group cursor-default'
      )}
      data-oid="tt9nbkl"
    >
      <CardContent
        className="p-4 text-slate-900 dark:text-white relative z-10 transition-transform duration-500 group-hover:scale-[0.98]"
        data-oid="bhfg:7i"
      >
        <div className="flex justify-between items-start mb-3" data-oid="vaydl.3">
          <div
            className={cn(
              'p-2 rounded-xl shadow-sm border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
              accentColors[type]
            )}
            data-oid=":5b8dhw"
          >
            <Icon className="w-4 h-4" data-oid="k88:ni7" />
          </div>
          <div
            className="flex -space-x-1.5 transition-transform duration-500 group-hover:translate-x-1"
            data-oid="ys.ipu4"
          >
            {[...Array(3)].map((_, i) => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}-${i}`}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm object-cover"
                alt="Participant"
                data-oid="uxoc_qw"
              />
            ))}
            <div
              className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-[7px] text-white font-black shadow-lg"
              data-oid="w.rgx5t"
            >
              +{members}
            </div>
          </div>
        </div>

        <div className="space-y-1 mb-3" data-oid="md:t-5r">
          <div className="flex gap-2" data-oid="qfvehyo">
            <Badge
              variant="secondary"
              className={cn(
                'border-none rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-sm transition-transform duration-500 group-hover:translate-x-0.5',
                accentColors[type]
              )}
              data-oid="irarifj"
            >
              {type}
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-300 rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-white/50 dark:bg-white/5"
              data-oid="2xx85p8"
            >
              {difficulty}
            </Badge>
          </div>
          <h3
            className="text-base font-black leading-tight truncate pt-1 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-500"
            data-oid="6lpsg-_"
          >
            {name}
          </h3>
        </div>

        <div
          className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/30 dark:border-white/5"
          data-oid="vjml-cc"
        >
          <div
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"
            data-oid="f-5bcyo"
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full ring-2 ring-offset-0 ring-transparent',
                isFull
                  ? 'bg-slate-300 dark:bg-slate-600'
                  : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] dark:ring-emerald-500/20 animate-pulse'
              )}
              data-oid="m_makfk"
            />

            {isFull ? 'Full' : 'Ready'}
          </div>
          <Lock
            className="w-3 h-3 text-slate-400 dark:text-slate-600 transition-transform duration-500 group-hover:rotate-12"
            data-oid="qlbo122"
          />
        </div>

        {/* Premium Overlay */}
        <div
          className="absolute inset-0 bg-white/20 dark:bg-black/60 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-3 translate-y-2 group-hover:translate-y-0"
          data-oid="7gvtmjw"
        >
          <div
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 delay-75"
            data-oid="ut3jj86"
          >
            <Lock className="w-4 h-4" data-oid="g40a1r8" />
          </div>
          <span
            className="text-[10px] font-black text-white dark:text-white uppercase tracking-widest bg-indigo-600 px-4 py-1.5 rounded-full shadow-2xl border border-indigo-400/30 scale-90 group-hover:scale-100 transition-transform duration-500 delay-100 italic"
            data-oid="5chjr9q"
          >
            Pro Access Preview
          </span>
        </div>
      </CardContent>
    </Card>
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
    <div
      className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden"
      data-oid="3l2l21a"
    >
      {/* Premium Dark Mode Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="na842tx"
      >
        {/* Soft Indigo/Slate Blobs for depth */}
        <div
          className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]"
          data-oid="n6ux8xw"
        />

        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]"
          data-oid="7f3r9.c"
        />

        <div
          className="absolute top-[20%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-slate-200/10 dark:bg-slate-900/15 blur-[80px]"
          data-oid=":ar-w.1"
        />

        {/* Dark Mode Specific Center Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
          data-oid="5r0hyjy"
        />

        {/* Subtle Mono Mesh Gradient */}
        <div
          className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]"
          data-oid="ln8oi7_"
        />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
          data-oid="b-_o9mh"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10"
        data-oid="e-nnh8n"
      >
        <PageHeader data-oid="1.w.hmm" />

        {/* Main "Coming Soon" Experience */}
        <div className="grid lg:grid-cols-12 gap-8 items-start" data-oid="wo2mqz4">
          <div className="lg:col-span-8 space-y-8" data-oid=".id9r2m">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[2rem] border border-blue-200/50 dark:border-blue-500/10 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 backdrop-blur-3xl shadow-2xl p-6 md:p-8"
              data-oid="qt-ub-y"
            >
              <div className="absolute top-0 right-0 p-6" data-oid="m5bz5fx">
                <ShieldCheck className="w-8 h-8 text-blue-500 opacity-20" data-oid="6zjcce4" />
              </div>

              <div className="relative z-10 max-w-2xl space-y-6" data-oid="htx3s12">
                <div className="space-y-3" data-oid="1:g-lx9">
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30"
                    data-oid="7_:sahq"
                  >
                    <Clock className="w-3 h-3" data-oid="g7honjo" />
                    <span data-oid="rc-:z.4">Launching Next Quarter</span>
                  </div>
                  <h2
                    className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight"
                    data-oid="uyxzh9u"
                  >
                    Connect, Collaborate, and Conquer.
                  </h2>
                  <p
                    className="text-slate-500 dark:text-slate-400 text-base font-semibold leading-relaxed"
                    data-oid="9cfg9sw"
                  >
                    A state-of-the-art virtual simulation environment. Join specialized rooms to
                    practice with peers at your level.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4" data-oid="vuu9pgn">
                  <FeatureHighlight
                    icon={Video}
                    title="Live Video Practice"
                    desc="Face-to-face practice rooms for speaking."
                    color="blue"
                    data-oid="y04s.qt"
                  />

                  <FeatureHighlight
                    icon={MessageSquare}
                    title="Direct Feedback"
                    desc="Peer reviews on your writing tasks."
                    color="indigo"
                    data-oid="l552._8"
                  />

                  <FeatureHighlight
                    icon={Trophy}
                    title="Group Missions"
                    desc="Team challenges and joint rewards."
                    color="purple"
                    data-oid="zcbaej7"
                  />

                  <FeatureHighlight
                    icon={Bot}
                    title="AI Moderation"
                    desc="Focused and productive study sessions."
                    color="rose"
                    data-oid="lmnghgs"
                  />
                </div>

                <div className="pt-2 block" data-oid="fs.6xo9">
                  <Button
                    disabled
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 text-white text-sm font-black uppercase tracking-widest cursor-not-allowed shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/40 border border-white/20 backdrop-blur-sm relative overflow-hidden group"
                    data-oid="cfzz:eo"
                  >
                    <span className="relative z-10" data-oid="d4vkfox">
                      Coming Soon
                    </span>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      data-oid="g6gkh6q"
                    />
                  </Button>
                  <p
                    className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"
                    data-oid="r94efec"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" data-oid="hbhnmh5" />
                    Exclusive to Pro & Premium Members
                  </p>
                </div>
              </div>

              {/* Decorative Blur */}
              <div
                className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"
                data-oid="6lq06xu"
              />
            </motion.div>

            {/* Preview Section */}
            <div className="space-y-6" data-oid="qhmbxx:">
              <div className="flex items-center justify-between" data-oid="-aq7_gf">
                <h3
                  className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
                  data-oid="ow.bnls"
                >
                  Active Rooms Preview
                </h3>
                <Badge
                  variant="outline"
                  className="border-indigo-500/20 text-indigo-500 font-black px-4 py-1.5 rounded-full uppercase text-[10px]"
                  data-oid="k_qccyf"
                >
                  Real-time Status
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pb-2" data-oid="0p7vro6">
                {previews.map((preview, i) => (
                  <GroupPreviewCard key={i} {...preview} data-oid="jbaos4z" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8" data-oid="-_30415">
            <Card
              className="rounded-[2rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl shadow-xl p-8 md:p-9 relative overflow-hidden"
              data-oid="bcesovi"
            >
              <div className="relative z-10 space-y-6" data-oid="gpdma-m">
                <div className="space-y-1" data-oid="5boraav">
                  <h3
                    className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
                    data-oid="o.7cco5"
                  >
                    How it works
                  </h3>
                  <p
                    className="text-sm text-slate-500 dark:text-slate-400 font-medium"
                    data-oid="fvp9:jq"
                  >
                    Four simple steps to mastery.
                  </p>
                </div>

                <div className="space-y-6 text-slate-900 dark:text-white" data-oid="bcxev:t">
                  {[
                    {
                      step: '01',
                      title: 'Pick a Topic',
                      desc: 'Reading, Writing, Speaking or Listening.',
                      color: 'text-blue-600 dark:text-blue-400',
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
                      color: 'text-orange-600 dark:text-orange-400',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group/item" data-oid="o72dn1t">
                      <span
                        className={`${item.color}/15 dark:${item.color}/25 group-hover/item:${item.color}/40 dark:group-hover/item:${item.color}/60 text-3xl font-black transition-colors leading-none italic`}
                        data-oid="2zz43ui"
                      >
                        {item.step}
                      </span>
                      <div className="space-y-0.5" data-oid="7-2ayc7">
                        <h5
                          className="font-black text-[14px] uppercase tracking-widest"
                          data-oid=":v.iy:5"
                        >
                          {item.title}
                        </h5>
                        <p
                          className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-snug"
                          data-oid="ksveqh-"
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30"
                  data-oid="xzzjcf2"
                >
                  <p
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tight"
                    data-oid="fy7z8ez"
                  >
                    <strong data-oid="pebh.59">PRO TIP:</strong> Group study increases retention
                    rates by up to 45%.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
