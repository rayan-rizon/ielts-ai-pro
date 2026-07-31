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
      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#0b0a10] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-[0.12] dark:opacity-[0.16]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 -z-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
        />
        <div className="relative z-10 mx-auto max-w-[1440px]">
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
