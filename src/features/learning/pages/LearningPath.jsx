import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData from '@/features/learning/hooks/useLearningPathData';
import StudyPlanDashboard from '@/features/learning/components/dashboard/StudyPlanDashboard';
import StudyPlanPaywall from '@/features/learning/components/dashboard/StudyPlanPaywall';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';
import DocumentHead from '@/components/shared/DocumentHead';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5';

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
      className="mt-4 h-9 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all duration-150 ease-smooth-out hover:bg-[#4a52c9] active:scale-95"
    >
      Retry study plan
    </button>
  </section>
);

export default function LearningPath() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const hasStudyPlanAccess = hasPaidAccess(user) || Boolean(isAdmin);
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
  } = useLearningPathData({ enabled: hasStudyPlanAccess });

  return (
    <>
      <DocumentHead
        title="Study plan | IELTS Ai Pro"
        description="An evidence-aware IELTS roadmap and realistic seven-day study schedule based on your exam date and availability."
      />
      <main className={PAGE_SHELL}>
        {/* Subtle dot grid runs the full page matching Dashboard theme */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
        />

        <div
          className={cn(
            'relative z-10 mx-auto max-w-[1440px]',
            hasStudyPlanAccess && hasError && 'grid min-h-[70vh] place-items-center'
          )}
        >
          {!hasStudyPlanAccess ? (
            <TooltipProvider delayDuration={150}>
              <StudyPlanPaywall user={user} />
            </TooltipProvider>
          ) : hasError ? (
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
