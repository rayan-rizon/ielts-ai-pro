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
    speakingMode,
    speakingV2State,
    upgradeDialogProps,
  } = shellProps;

  return (
    <div
      data-testid="speaking-test-page"
      className="relative min-h-full overflow-x-hidden bg-[#f8f8fb] transition-colors duration-500 dark:bg-[#08080a]"
    >
      <ExitDialog open={showExitDialog} blocker={blocker} {...exitDialogProps} />

      {/* Page Wrapper */}
      <div className="relative mx-auto w-full max-w-[1540px] px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-1 lg:px-5">
        <TestHeader
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          totalParts={totalParts}
          testTitle={testTitle}
          speakingMode={speakingMode}
          isPart2Prep={conversationPanelProps.isPart2Prep}
          isPartComplete={conversationPanelProps.isPartComplete}
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
              speakingMode={speakingMode}
              speakingV2State={speakingV2State}
            />
          </div>
        </div>
      </div>

      <UpgradeDialog open={showUpgradeDialog} authUser={authUser} {...upgradeDialogProps} />
    </div>
  );
}
