import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  Book,
  Award,
  Crown,
  Calendar,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LearningPath } from '@/features/learning/services/LearningPath';
import { cn } from '@/lib/cn';

const moduleIcons = {
  reading: BookOpen,
  writing: PenTool,
  listening: Headphones,
  speaking: Mic,
  vocabulary: Book,
  grammar: Award,
};

const moduleColors = {
  reading: { icon: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  writing: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  listening: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  speaking: {
    icon: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  vocabulary: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  grammar: { icon: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30' },
};

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function LearningPathSummary({ userEmail }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [learningPath, setLearningPath] = useState(null);
  const [user, setUser] = useState(null);
  const [todaysTasks, setTodaysTasks] = useState([]);

  useEffect(() => {
    if (authLoading) return;

    if (authUser) {
      loadUserData(authUser);
    } else {
      setUser({ subscription_tier: 'free' });
    }
  }, [authUser, authLoading]);

  const loadUserData = async (userData) => {
    try {
      setUser(userData);

      if (userData.subscription_tier === 'pro' || userData.subscription_tier === 'premium') {
        const paths = await LearningPath.list({ user_id: userData.id }, '-created_at', 1);
        if (paths && paths.length > 0) {
          const latest = paths[0];
          let data = latest.path_data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {}
          }
          if (data && typeof data === 'object') {
            setLearningPath(data);

            // Get today's tasks
            const today = new Date().getDay();
            const dayIndex = today === 0 ? 6 : today - 1;
            const todayKey = dayNames[dayIndex];
            const tasks = data.weekly_schedule?.[todayKey] || [];
            setTodaysTasks(tasks.slice(0, 2)); // Show max 2 tasks
          }
        }
      }
    } catch (error) {
      setUser({ subscription_tier: 'free' });
    }
  };

  if (user && user.subscription_tier === 'free') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl"
        data-oid="yaymajz"
      >
        <Card
          className="bg-white dark:bg-[#0a0a0f] border-none rounded-[2.5rem] overflow-hidden relative h-full"
          data-oid="vdlr9zv"
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20 animate-pulse"
            data-oid="pvps-e:"
          />

          <CardContent className="p-10 text-center relative z-10" data-oid="k_l2wus">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] relative"
              data-oid="a2ccuwu"
            >
              <Brain className="w-10 h-10 text-white" data-oid="3rawri8" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1 -right-1 w-8 h-8 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-900"
                data-oid="xgf:mcu"
              >
                <Sparkles className="w-4 h-4 text-amber-500" data-oid="n0w70c9" />
              </motion.div>
            </motion.div>

            <h3
              className="text-3xl font-black mb-3 text-foreground tracking-tight"
              data-oid="auchpg:"
            >
              Personalized AI Roadmap
            </h3>
            <p
              className="text-muted-foreground mb-8 text-base max-w-md mx-auto leading-relaxed"
              data-oid="cki-o8b"
            >
              Stop guessing. Let our AI analyze your performance and build a{' '}
              <span className="text-primary font-bold" data-oid=":.4_agy">
                bespoke learning path
              </span>{' '}
              to your target band score.
            </p>

            <Link to={createPageUrl('Pricing')} data-oid="nt.lxbc">
              <Button
                className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black px-10 py-6 h-auto text-lg rounded-2xl shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.6)] transition-all hover:scale-105 active:scale-95"
                data-oid="m0rf:4d"
              >
                <Crown className="w-6 h-6 mr-3" data-oid="rzi-txt" />
                Unlock Pro Features
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // No path yet - prompt to create
  if (!learningPath) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
        data-oid="-n_3ttf"
      >
        <Card
          className="bg-white dark:bg-card border-border/80 shadow-xl rounded-[2rem] relative overflow-hidden"
          data-oid="ehbt3dn"
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors"
            data-oid="-rw9_9_"
          />

          <CardContent className="p-8 text-center relative z-10" data-oid="q7_qeko">
            <div
              className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.3)]"
              data-oid="kgtdsd9"
            >
              <Brain className="w-8 h-8 text-white" data-oid="5za-kkd" />
            </div>

            <h3 className="text-xl font-black mb-2 text-foreground" data-oid="b452ejw">
              Create Your AI Learning Path
            </h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto" data-oid="zqp_iu.">
              Generate a customized 4-8 week roadmap based on your current band score and target
              goals.
            </p>

            <Link to={createPageUrl('LearningPath')} data-oid="jxcn_4b">
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 h-12 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
                data-oid="awk8m3x"
              >
                <Sparkles className="w-4 h-4 mr-2" data-oid="mdj3319" />
                Start Generation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="transition-transform duration-300"
      data-oid="dse308t"
    >
      <Card
        className="bg-white dark:bg-card border-border shadow-xl rounded-[2rem] overflow-hidden"
        data-oid="ra_2n-c"
      >
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20" data-oid="8qqf5u0">
          <div className="flex items-center justify-between" data-oid="soa.b40">
            <CardTitle className="flex items-center gap-3" data-oid="m.iqeab">
              <div
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg"
                data-oid="4kioeeq"
              >
                <Brain className="w-5 h-5 text-white" data-oid="93y291m" />
              </div>
              <div className="flex flex-col" data-oid="lhu-c9m">
                <span className="text-sm font-black tracking-tight" data-oid="8xeh3jv">
                  AI Learning Path
                </span>
                <span
                  className="text-[10px] text-primary font-bold uppercase tracking-widest"
                  data-oid="nmghvil"
                >
                  Active Roadmap
                </span>
              </div>
            </CardTitle>
            <Link to={createPageUrl('LearningPath')} data-oid="um71:.y">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-primary"
                data-oid="6mxl7xa"
              >
                Expand Path
                <ChevronRight className="w-3 h-3 ml-1" data-oid="zzzijvv" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6" data-oid="3ldaxku">
          {/* Quick Stats - More compact and distinct */}
          <div className="grid grid-cols-3 gap-4" data-oid="9-jo5pq">
            <div
              className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.25rem] border border-indigo-100 dark:border-indigo-800/50"
              data-oid=".x8i08k"
            >
              <div
                className="text-xl font-black text-indigo-600 dark:text-indigo-400"
                data-oid="8j_8n-9"
              >
                {learningPath.target_band_score || learningPath.target_level || '7.5'}
              </div>
              <div
                className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest"
                data-oid="t15x2s0"
              >
                Target
              </div>
            </div>
            <div
              className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-[1.25rem] border border-purple-100 dark:border-purple-800/50"
              data-oid="2:4j9by"
            >
              <div
                className="text-xl font-black text-purple-600 dark:text-purple-400"
                data-oid="je7xxhs"
              >
                {learningPath.completion_percentage || 0}%
              </div>
              <div
                className="text-[9px] font-bold text-purple-400/80 uppercase tracking-widest"
                data-oid="j26-80a"
              >
                Done
              </div>
            </div>
            <div
              className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-[1.25rem] border border-emerald-100 dark:border-emerald-800/50"
              data-oid=".r4:uy2"
            >
              <div
                className="text-xl font-black text-emerald-600 dark:text-emerald-400"
                data-oid="xzkku8-"
              >
                {learningPath.estimated_timeline || '6'}
              </div>
              <div
                className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest"
                data-oid="lw4yrf5"
              >
                Weeks
              </div>
            </div>
          </div>

          {/* Today's Focus */}
          <div className="space-y-3" data-oid="rxo509l">
            <div className="flex items-center gap-2" data-oid="ledvp-b">
              <div className="w-1 h-4 bg-primary rounded-full" data-oid="l7d:1n2" />
              <h4
                className="text-xs font-black uppercase tracking-widest text-foreground"
                data-oid="zx7apqj"
              >
                Today's Focus
              </h4>
            </div>

            {todaysTasks.length > 0 ? (
              <div className="space-y-3" data-oid="xw8:y44">
                {todaysTasks.map((task, idx) => {
                  const taskText = typeof task === 'string' ? task : task.title || task.activity;
                  const module = typeof task === 'object' ? task.module : null;
                  const moduleColor = moduleColors[module] || moduleColors.reading;
                  const Icon = moduleIcons[module] || Target;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group shadow-sm hover:shadow-md',
                        'bg-white dark:bg-[#0c0c12] border-border/80 hover:border-primary/40'
                      )}
                      data-oid="trt57p6"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
                          moduleColor.bg
                        )}
                        data-oid="m3-q1dv"
                      >
                        <Icon className={cn('w-5 h-5', moduleColor.icon)} data-oid="n1o-9_d" />
                      </div>
                      <span className="flex-1 text-sm font-bold text-foreground" data-oid="badw40f">
                        {taskText}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-oid="3:gq2zc"
                      >
                        <ArrowRight className="w-4 h-4 text-primary" data-oid="ug.nlaw" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="bg-muted/30 rounded-2xl p-6 text-center border border-dashed border-border"
                data-oid="vnsgdsy"
              >
                <Calendar
                  className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50"
                  data-oid="0:db_vk"
                />

                <p
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                  data-oid="w8bfv22"
                >
                  No tasks scheduled for today
                </p>
              </div>
            )}
          </div>

          {/* Next Milestone */}
          {learningPath.milestones && learningPath.milestones.length > 0 && (
            <div
              className="relative group p-4 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 rounded-2xl border border-indigo-500/10"
              data-oid="qzu-t2m"
            >
              <div className="flex items-start gap-3" data-oid="y_11q-g">
                <div
                  className="p-2.5 bg-white dark:bg-card rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900"
                  data-oid="_8m7vve"
                >
                  <Target className="w-4 h-4 text-indigo-600" data-oid="narvgas" />
                </div>
                <div className="flex-1 min-w-0" data-oid="zymxh.9">
                  <div className="flex items-center gap-2 mb-1" data-oid="-4pzz13">
                    <span
                      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter"
                      data-oid="qeo4az2"
                    >
                      Milestone {learningPath.milestones[0].week || 1}
                    </span>
                    <Badge
                      className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[8px] h-4 font-black uppercase ring-0 border-none"
                      data-oid="df82b24"
                    >
                      Current Goal
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-foreground leading-snug" data-oid="-5kd6_l">
                    {learningPath.milestones[0].goal}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
