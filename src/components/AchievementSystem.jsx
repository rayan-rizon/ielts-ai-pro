import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Award,
  Target,
  Flame,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  Book,
  TrendingUp,
  Calendar,
  Zap,
  Crown,
  Medal,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserAchievement, Achievement, UserPoints } from '@/entities';
import { User } from '@/entities';

const achievementIcons = {
  trophy: Trophy,
  star: Star,
  award: Award,
  target: Target,
  flame: Flame,
  book: BookOpen,
  pen: PenTool,
  headphones: Headphones,
  mic: Mic,
  vocabulary: Book,
  trending: TrendingUp,
  calendar: Calendar,
  zap: Zap,
  crown: Crown,
  medal: Medal,
};

const badgeColors = {
  bronze: 'from-amber-400 to-orange-500',
  silver: 'from-gray-400 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  diamond: 'from-purple-400 to-pink-500',
};

const badgeTextColors = {
  bronze: 'text-amber-100',
  silver: 'text-gray-100',
  gold: 'text-yellow-100',
  diamond: 'text-purple-100',
};

export default function AchievementSystem({ compact = false }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [userAchievements, setUserAchievements] = useState([]);
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [, setUserPoints] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setNewAchievement] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (authUser) {
      loadAchievements(authUser);
    } else {
      setIsLoading(false);
    }

    // Listen for new achievements
    const handleAchievementUnlocked = (event) => {
      setNewAchievement(event.detail);
      if (authUser) loadAchievements(authUser);

      // Clear notification after 5 seconds
      setTimeout(() => setNewAchievement(null), 5000);
    };

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked);
    return () => window.removeEventListener('achievementUnlocked', handleAchievementUnlocked);
  }, [authUser, authLoading]);

  const loadAchievements = async (userData) => {
    setIsLoading(true);
    try {
      // Load user's achievements
      const userAchs = await UserAchievement.list({ user_id: userData.id });
      setUserAchievements(userAchs);

      // Load all available achievements
      const allAchs = await Achievement.list();
      setAvailableAchievements(allAchs);

      // Load user points
      const points = await UserPoints.list({ user_id: userData.id }, '-updated_at', 1);
      if (points.length > 0) {
        setUserPoints(points[0]);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
    setIsLoading(false);
  };

  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId && ua.is_completed);
  };

  if (isLoading) {
    return (
      <Card
        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg"
        data-oid="sh0n9q7"
      >
        <CardContent className={compact ? 'p-3' : 'p-4'} data-oid="c-s.-lg">
          <div className="animate-pulse space-y-2" data-oid="cz1lvj_">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" data-oid="vnzoa6h"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" data-oid="kcgryux"></div>
            <div
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
              data-oid="4fhyz:9"
            ></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedAchievements = availableAchievements.filter((a) => isAchievementUnlocked(a.id));
  const totalAchievements = availableAchievements.length;
  const completionPercentage =
    totalAchievements > 0 ? Math.round((unlockedAchievements.length / totalAchievements) * 100) : 0;

  if (compact) {
    return (
      <Card
        className="relative rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white shadow-2xl shadow-indigo-500/5 overflow-hidden group dark:bg-slate-900/40 dark:backdrop-blur-xl"
        data-oid="5hylush"
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 pointer-events-none"
          data-oid="9:kv0t5"
        />

        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="126d:5y"
        />

        <CardContent className="p-7" data-oid="u_agsij">
          <div className="flex items-center justify-between mb-6" data-oid="3zdr4n9">
            <div className="flex items-center gap-4" data-oid="6t_7k35">
              <div
                className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 transform group-hover:-rotate-6 transition-transform duration-500"
                data-oid="cl87e5p"
              >
                <Trophy className="w-7 h-7 text-white" data-oid="4.2c53o" />
              </div>
              <div data-oid="7m5c13_">
                <h3
                  className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight"
                  data-oid="0s_zmf_"
                >
                  Mastery Hall
                </h3>
                <p
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5"
                  data-oid="zqnh85z"
                >
                  {unlockedAchievements.length} / {totalAchievements} Unlocked
                </p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4 mb-8" data-oid="sj2.39o">
            <div className="flex items-center justify-between px-1" data-oid="fuyqrh4">
              <span
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                data-oid="-z8y-9_"
              >
                Overall Completion
              </span>
              <div
                className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tighter tabular-nums"
                data-oid=".3mkx_4"
              >
                {completionPercentage}
                <span className="text-xs ml-0.5" data-oid="7mt:mrk">
                  %
                </span>
              </div>
            </div>
            <div
              className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-white/5 overflow-hidden"
              data-oid="r7rtwa8"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                data-oid="eflgum9"
              />
            </div>
          </div>

          {/* Achievement Icons Grid */}
          <div className="grid grid-cols-4 gap-3" data-oid="mjo5y0y">
            {availableAchievements.slice(0, 8).map((achievement, idx) => {
              const Icon = achievementIcons[achievement.icon] || Trophy;
              const isUnlocked = isAchievementUnlocked(achievement.id);
              const gradientClass =
                badgeColors[achievement.badge_color] || 'from-slate-200 to-slate-400';
              const textColorClass = badgeTextColors[achievement.badge_color] || 'text-slate-800';

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.15, y: -4, rotate: 5 }}
                  className={`relative w-full aspect-square rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 border ${
                    isUnlocked
                      ? `bg-gradient-to-br ${gradientClass} border-white/30 shadow-orange-500/10`
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5 opacity-40'
                  }`}
                  data-oid="gvp1txf"
                >
                  {isUnlocked && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full border-2 border-amber-500 flex items-center justify-center shadow-lg"
                      data-oid="108qzk5"
                    >
                      <Sparkles
                        className="w-2.5 h-2.5 text-amber-500 animate-pulse"
                        data-oid="jyw2p:j"
                      />
                    </div>
                  )}
                  <Icon
                    className={`w-1/2 h-1/2 ${
                      isUnlocked ? textColorClass : 'text-slate-400 dark:text-slate-600'
                    }`}
                    data-oid="la5c1nq"
                  />

                  {/* Lock Overlay for locked ones */}
                  {!isUnlocked && (
                    <div
                      className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] rounded-2xl"
                      data-oid="py57vo."
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400 opacity-20" data-oid="2oy7b1d" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer badge */}
          {availableAchievements.length > 8 && (
            <div className="mt-6 flex justify-center" data-oid="rs83.nv">
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 px-3 py-1 rounded-full cursor-help hover:bg-slate-100 transition-colors"
                title={`${availableAchievements.length - 8} more achievements to unlock`}
                data-oid="x4vi6us"
              >
                +{availableAchievements.length - 8} SECRET REWARDS
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-oid="r:jxk7s">
      <Card
        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg rounded-2xl"
        data-oid="r.:8lu9"
      >
        <CardHeader data-oid="3wibo4r">
          <CardTitle
            className="flex items-center gap-2 text-gray-900 dark:text-white"
            data-oid="w70hx3q"
          >
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" data-oid="-ejvydj" />(
            {unlockedAchievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="-c.ye03">
          {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="_zzgxa-">
              {unlockedAchievements.map((achievement) => {
                const Icon = achievementIcons[achievement.icon] || Trophy;
                const gradientClass =
                  badgeColors[achievement.badge_color] || 'from-gray-200 to-gray-400';
                const textColorClass = badgeTextColors[achievement.badge_color] || 'text-gray-800';

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-lg border-2 bg-gradient-to-br ${gradientClass} shadow-lg`}
                    data-oid="zhueo.l"
                  >
                    <div className="flex items-center gap-3" data-oid="_v63z5d">
                      <div
                        className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-sm`}
                        data-oid="55s6oy_"
                      >
                        <Icon className={`w-6 h-6 ${textColorClass}`} data-oid="7nxq5-5" />
                      </div>
                      <div className="flex-1" data-oid="igrwls7">
                        <h4 className={`font-semibold ${textColorClass}`} data-oid="vlguvsr">
                          {achievement.name}
                        </h4>
                        <p className={`text-sm ${textColorClass} opacity-90`} data-oid="qfqqlmm">
                          {achievement.description}
                        </p>
                        <Badge
                          className="mt-2 text-xs bg-white/20 text-white border-white/30"
                          data-oid="mavc2.j"
                        >
                          +{achievement.points} XP
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8" data-oid="cx637mj">
              <Trophy
                className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4"
                data-oid="20dk3sf"
              />

              <h3
                className="text-lg font-semibold mb-2 text-gray-900 dark:text-white"
                data-oid="0wld-bp"
              >
                No Achievements Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400" data-oid="p.2yabs">
                Complete practice tests to start earning achievements!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
