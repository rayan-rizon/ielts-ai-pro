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
      <main className="min-h-full bg-[radial-gradient(circle_at_78%_0%,rgba(226,222,255,0.36),transparent_32%),#f8f9fc] px-3 py-4 pt-16 text-slate-950 dark:bg-[#070913] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
        <div className="mx-auto max-w-[1440px]">
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
