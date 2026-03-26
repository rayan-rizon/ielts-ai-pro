import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Star, Flame, Award, TrendingUp } from 'lucide-react';
import { UserPoints } from '@/entities';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function PointsDisplay({ compact = false, showAnimation = true }) {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(null);
  const [recentPoints, setRecentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPoints();
    }

    // Listen for point updates
    const handlePointsUpdate = (event) => {
      setRecentPoints(event.detail.pointsEarned);
      if (user) {
        loadUserPoints();
      }

      // Reset animation after 3 seconds
      setTimeout(() => setRecentPoints(0), 3000);
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [user]);

  const loadUserPoints = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Try to get existing user points
      const points = await UserPoints.getByUserId(user.id);

      if (points) {
        setUserPoints(points);
      } else {
        // Create initial points record using schema fields
        const newPoints = await UserPoints.create({
          user_id: user.id,
          points: 0,
          level: 1,
        });
        setUserPoints(newPoints);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
      // Set default points if there's an error
      setUserPoints({
        user_id: user.id,
        points: 0,
        level: 1,
      });
    }
    setIsLoading(false);
  };

  const getLevelIcon = (level) => {
    if (level >= 20) return Trophy;
    if (level >= 15) return Award;
    if (level >= 10) return Star;
    if (level >= 5) return Zap;
    return Flame;
  };

  if (isLoading || !userPoints) {
    return (
      <Card className="border shadow-sm" data-oid="s-3gbzo">
        <CardContent className={compact ? 'p-3' : 'p-4'} data-oid="x6i5p5_">
          <div className="animate-pulse" data-oid="ztdn.8g">
            <div className="h-4 bg-muted rounded mb-2" data-oid="zw-.a1b"></div>
            <div className="h-6 bg-muted rounded" data-oid="a7ucm9d"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Derived values based on actual schema (points/level only)
  const totalPoints = userPoints.points ?? 0;
  const pointsToNextLevel = 100 - (totalPoints % 100 || 100);
  const LevelIcon = getLevelIcon(userPoints.level);
  const progressPercentage = ((totalPoints % 100) / 100) * 100;
  const categoryBreakdown = userPoints.points_by_category || {
    reading: 0,
    writing: 0,
    listening: 0,
    speaking: 0,
    vocabulary: 0,
    streak: 0,
    improvement: 0,
  };

  if (compact) {
    return (
      <Card
        className="border shadow-sm"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--card-foreground)',
        }}
        data-oid="4:7j1pq"
      >
        <CardContent className="p-3" data-oid="5:_zi7j">
          <div className="flex items-center justify-between" data-oid="9452v_8">
            <div className="flex items-center gap-2" data-oid="rr-:4qa">
              <div
                className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shadow-sm"
                data-oid="pesoico"
              >
                <LevelIcon
                  className="w-4 h-4 text-amber-600 dark:text-amber-400"
                  data-oid="d676mx:"
                />
              </div>
              <div data-oid="0:0f_f_">
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--card-foreground)' }}
                  data-oid="3nob_pi"
                >
                  Level {userPoints.level}
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                  data-oid="mbmfl98"
                >
                  {totalPoints} XP
                </div>
              </div>
            </div>

            <AnimatePresence data-oid="x_-um9f">
              {showAnimation && recentPoints > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.6 }}
                  className="text-green-600 dark:text-green-400 font-bold text-sm"
                  data-oid="d:d-_sz"
                >
                  +{recentPoints} XP
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-2" data-oid="v31wgyw">
            <Progress value={progressPercentage} className="h-1.5" data-oid="msb0ny9" />
            <div
              className="text-xs mt-1 text-right"
              style={{ color: 'var(--muted-foreground)' }}
              data-oid="y8dhmmv"
            >
              {pointsToNextLevel} XP to Level {userPoints.level + 1}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border shadow-sm"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--card-foreground)',
      }}
      data-oid="uvenyh1"
    >
      <CardContent className="p-6" data-oid="vfr.czt">
        <div className="flex items-center justify-between mb-4" data-oid="9o36.nq">
          <div className="flex items-center gap-3" data-oid="u.zbutl">
            <div
              className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-sm"
              data-oid="-vityrf"
            >
              <LevelIcon
                className="w-6 h-6 text-amber-600 dark:text-amber-400"
                data-oid="aemdsev"
              />
            </div>
            <div data-oid="hbhqfxj">
              <h3
                className="text-lg font-bold"
                style={{ color: 'var(--card-foreground)' }}
                data-oid="hem_fdt"
              >
                Level {userPoints.level}
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
                data-oid=".a7unbn"
              >
                {totalPoints} Total XP
              </p>
            </div>
          </div>

          <AnimatePresence data-oid="g5xdyx4">
            {showAnimation && recentPoints > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.6 }}
                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-bold text-sm border border-green-200 dark:border-green-800/50 shadow-sm"
                data-oid="qt59cst"
              >
                +{recentPoints} XP
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3" data-oid="ymn86zn">
          <div className="flex items-center justify-between text-sm" data-oid="_d55f9.">
            <span style={{ color: 'var(--muted-foreground)' }} data-oid="qcc92h4">
              Progress to Level {userPoints.level + 1}
            </span>
            <span
              className="font-medium"
              style={{ color: 'var(--card-foreground)' }}
              data-oid="7sepesc"
            >
              {pointsToNextLevel} XP remaining
            </span>
          </div>

          <Progress value={progressPercentage} className="h-2" data-oid="f9nd_8b" />
        </div>

        {/* Category Breakdown */}
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: 'var(--border)' }}
          data-oid="e5nrc6_"
        >
          <h4
            className="text-sm font-semibold mb-2 flex items-center gap-2"
            style={{ color: 'var(--card-foreground)' }}
            data-oid="p6w9bny"
          >
            <TrendingUp className="w-4 h-4" data-oid="ydh_fw0" />
            Points by Category
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs" data-oid=":xf_mi7">
            {Object.entries(categoryBreakdown).map(([category, points]) => (
              <div key={category} className="flex justify-between" data-oid="tj37z55">
                <span
                  className="capitalize"
                  style={{ color: 'var(--muted-foreground)' }}
                  data-oid="8x8pzhp"
                >
                  {category}:
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--card-foreground)' }}
                  data-oid="4kkiock"
                >
                  {points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
