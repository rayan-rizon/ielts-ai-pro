import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import useLearningPathData from '@/features/learning/hooks/useLearningPathData';
import LearningPathDashboard from '@/features/learning/components/dashboard/LearningPathDashboard';
import DocumentHead from '@/components/shared/DocumentHead';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

// pt-16 on mobile, not pt-14: the floating sidebar toggle Layout renders at
// top-4 is 40px tall, so it ended exactly on the old padding edge and sat on
// the "AI Learning Path" pill with no clearance at all.
const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-3 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-3 md:px-5 md:py-4';

const LearningPathBackdrop = () => (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
    />
  </>
);

const LearningPathError = ({ onRetry }) => (
  <section className={cn(PANEL, 'mx-auto w-full max-w-lg p-6 text-center')}>
    <AlertTriangle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-300" />
    <h1 className="mt-3 text-lg font-extrabold">Learning Path could not be loaded</h1>
    <p className={cn('mt-1 text-sm', MUTED)}>
      Your saved plan and completed activities are unchanged. Retry before updating the plan.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 h-9 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white hover:bg-[#4a52c9]"
    >
      Retry Learning Path
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
        title="Personalized AI Learning Path | IELTS Ai Pro"
        description="An evidence-aware IELTS roadmap and realistic seven-day study schedule based on your exam date and availability."
      />
      <main className={PAGE_SHELL}>
        <LearningPathBackdrop />
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
            </TooltipProvider>
          )}
        </div>
      </main>
    </>
  );
}
