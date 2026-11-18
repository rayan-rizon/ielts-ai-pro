import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData from '@/features/learning/hooks/useLearningPathData';
import StudyPlanDashboard from '@/features/learning/components/dashboard/StudyPlanDashboard';
import DocumentHead from '@/components/shared/DocumentHead';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f7f7f9] px-3 py-3 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-4';

const LearningPathError = ({ onRetry }) => (
  <section className={cn(PANEL, 'mx-auto w-full max-w-lg p-6 text-center')}>
    <AlertTriangle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-300" />
    <h1 className="mt-3 text-lg font-extrabold">Study plan could not be loaded</h1>
    <p className={cn('mt-1 text-sm', MUTED)}>
      Your saved plan and completed activities are unchanged. Retry before updating the plan.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 h-9 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white hover:bg-[#4a52c9]"
    >
      Retry study plan
    </button>
  </section>
);

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
    hasError,
    retry,
  } = useLearningPathData();

  return (
    <>
      <DocumentHead
        title="Study plan | IELTS Ai Pro"
        description="An evidence-aware IELTS roadmap and realistic seven-day study schedule based on your exam date and availability."
      />
      <main className={PAGE_SHELL}>
        <div
          className={cn(
            'relative z-10 mx-auto max-w-[1440px]',
            hasError && 'grid min-h-[70vh] place-items-center'
          )}
        >
          {hasError ? (
            <LearningPathError onRetry={() => retry()} />
          ) : (
            <TooltipProvider delayDuration={150}>
              <div>
                <StudyPlanDashboard
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
            </TooltipProvider>
          )}
        </div>
      </main>
    </>
  );
}
