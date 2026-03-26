import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UserAnalytics from './UserAnalytics';
import RevenueAnalytics from './RevenueAnalytics';
import { User, TestSession, PromoCode, Passage, Question } from '@/entities';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [usersData, questionsData, passagesData, sessionsData, promoData] = await Promise.all([
        User.list('-created_at'),
        Question.list(),
        Passage.list({ is_active: true }),
        TestSession.list({}, '-created_at'),
        PromoCode.list({ is_active: true }),
      ]);

      const premiumUsers = usersData.filter(
        (u) => u.subscription_tier === 'pro' || u.subscription_tier === 'premium'
      ).length;
      const completedSessions = sessionsData.filter((s) => s.is_completed).length;
      const avgScore =
        completedSessions > 0
          ? sessionsData
              .filter((s) => s.score !== null && s.score !== undefined)
              .reduce((acc, s) => acc + s.score, 0) /
            sessionsData.filter((s) => s.score !== null && s.score !== undefined).length
          : 0;

      // Calculate analytics data
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyActiveUsers = usersData.filter(
        (u) => new Date(u.last_login || u.created_at) >= weekAgo
      ).length;
      const monthlyActiveUsers = usersData.filter(
        (u) => new Date(u.last_login || u.created_at) >= monthAgo
      ).length;

      // Simulated revenue data
      const simulatedRevenue = premiumUsers * 9.99; // Assuming $9.99 per pro user (average)

      setStats({
        totalUsers: usersData.length,
        premiumUsers,
        totalQuestions: questionsData.length,
        totalPassages: passagesData.length,
        completedTests: completedSessions,
        avgScore: avgScore.toFixed(1),
        conversionRate:
          usersData.length > 0 ? ((premiumUsers / usersData.length) * 100).toFixed(1) : 0,
      });

      setAnalyticsData({
        weeklyActiveUsers,
        monthlyActiveUsers,
        simulatedRevenue,
        totalRevenue: simulatedRevenue,
        monthlyGrowth: 12.5, // Simulated growth percentage
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
        data-oid="ahnc71g"
      >
        <h2 className="text-3xl font-bold text-foreground mb-6" data-oid="a9n76m_">
          Analytics Dashboard
        </h2>
        <div className="flex items-center justify-center h-64" data-oid="1i0uw66">
          <div className="text-center" data-oid="w2gzb-:">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
              data-oid="oqlck3t"
            ></div>
            <p className="text-muted-foreground" data-oid="03vcaxy">
              Loading analytics data...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
      data-oid="h1flrjj"
    >
      <h2 className="text-3xl font-bold text-foreground mb-6" data-oid="h:rwdy4">
        Analytics Dashboard
      </h2>
      <UserAnalytics stats={stats} analyticsData={analyticsData} data-oid="o2skvju" />
      <RevenueAnalytics
        analyticsData={analyticsData}
        stats={stats}
        users={users}
        data-oid="9z7uglx"
      />
    </motion.div>
  );
};

export default AnalyticsDashboard;
