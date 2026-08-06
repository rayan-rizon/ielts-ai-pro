import { createPageUrl } from '@/utils';

import PremiumLoading from '@/components/ui/PremiumLoading';

import ExitDialog from './ExitDialog';
import SpeakingConversationPanel from './SpeakingConversationPanel';
import SpeakingReport from './SpeakingReport';
import SpeakingSessionRail from './SpeakingSessionRail';
import SpeakingTestUnavailable from './SpeakingTestUnavailable';
import TestHeader from './TestHeader';
import UpgradeDialog from './UpgradeDialog';

export default function SpeakingTestPageView({
  error,
  isLoading,
  isTestComplete,
  navigate,
  reportProps,
  shellProps,
}) {
  if (isLoading) {
    return <PremiumLoading message="Preparing your speaking test..." />;
  }

  if (error) {
    return <SpeakingTestUnavailable error={error} />;
  }

  if (isTestComplete) {
    return <SpeakingReport {...reportProps} />;
  }

  const {
    authUser,
    blocker,
    conversationPanelProps,
    currentPart,
    currentPartNumber,
    exitDialogProps,
    handsFreeEnabled,
    headerProps,
    isTestComplete: shellIsTestComplete,
    setShowExitDialog,
    setHandsFreeEnabled,
    showExitDialog,
    showUpgradeDialog,
    testStarted,
    testTitle,
    totalParts,
    upgradeDialogProps,
  } = shellProps;

  return (
    <div
      data-testid="speaking-test-page"
      className="relative min-h-full overflow-x-hidden bg-[#f8f8fb] transition-colors duration-500 dark:bg-[#08080a]"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-48 h-128 w-128 rounded-full bg-rose-500/6 blur-3xl dark:bg-rose-500/8" />
        <div className="absolute -right-40 -bottom-56 h-144 w-144 rounded-full bg-red-500/4.5 blur-3xl dark:bg-red-500/6" />
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_0.8px,transparent_0.8px)] bg-size-[22px_22px] opacity-[0.055] mask-[linear-gradient(to_bottom,black,transparent_72%)] dark:opacity-[0.08]" />
      </div>

      <ExitDialog open={showExitDialog} blocker={blocker} {...exitDialogProps} />

      {/* Page Wrapper */}
      <div className="relative mx-auto w-full max-w-[1540px] px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-1 lg:px-5">
        <TestHeader
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          totalParts={totalParts}
          testTitle={testTitle}
          isPart2Prep={conversationPanelProps.isPart2Prep}
          onShowExitDialog={() => {
            if (!shellIsTestComplete && testStarted) {
              setShowExitDialog(true);
            } else {
              navigate(createPageUrl('Speaking'));
            }
          }}
          {...headerProps}
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-4">
          <div className="order-2 min-w-0 xl:order-1">
            <SpeakingConversationPanel
              currentPartNumber={currentPartNumber}
              currentPart={currentPart}
              allParts={shellProps.allParts}
              authUser={authUser}
              {...conversationPanelProps}
            />
          </div>

          <div className="order-1 min-w-0 xl:order-2">
            <SpeakingSessionRail
              allParts={shellProps.allParts}
              currentPartNumber={currentPartNumber}
              testStarted={conversationPanelProps.testStarted}
              isPart2Prep={conversationPanelProps.isPart2Prep}
              handsFreeEnabled={handsFreeEnabled}
              onHandsFreeChange={setHandsFreeEnabled}
            />
          </div>
        </div>
      </div>

      <UpgradeDialog open={showUpgradeDialog} authUser={authUser} {...upgradeDialogProps} />
    </div>
  );
}
