import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData from '@/features/learning/hooks/useLearningPathData';
import LearningPathDashboard from '@/features/learning/components/dashboard/LearningPathDashboard';
import DocumentHead from '@/components/shared/DocumentHead';

export default function LearningPath() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    learningPath,
    stats,
    skillMap,
    isLoading,
    activityByKey,
    toggleActivity,
    rescheduleActivity,
  } = useLearningPathData(true);

  return (
    <>
      <DocumentHead
        title="Personalized AI Learning Path | IELTS Ai Pro"
        description="An evidence-aware IELTS roadmap and realistic seven-day study schedule based on your exam date and availability."
      />
      <main className="relative min-h-screen bg-[#f8f9fd] px-3 py-5 text-slate-950 dark:bg-[#070913] dark:text-white sm:px-5 md:px-7 md:py-8">
        {/* Modern Ambient Glow & Study Grid Mesh Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,0.12),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(6,182,212,0.08),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(244,63,94,0.05),transparent_45%)]"
        />
        <div className="relative mx-auto max-w-[1520px]">
          <LearningPathDashboard
            user={user}
            learningPath={learningPath}
            stats={stats}
            skillMap={skillMap}
            activityByKey={activityByKey}
            toggleActivity={toggleActivity}
            rescheduleActivity={rescheduleActivity}
            isLoading={isLoading}
            navigate={navigate}
          />
        </div>
      </main>
    </>
  );
}
