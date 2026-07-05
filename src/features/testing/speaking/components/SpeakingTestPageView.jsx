import { createPageUrl } from '@/utils';

import PremiumLoading from '@/components/ui/PremiumLoading';

import ExitDialog from './ExitDialog';
import SpeakingConversationPanel from './SpeakingConversationPanel';
import SpeakingReport from './SpeakingReport';
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
    conversationLength,
    conversationPanelProps,
    currentPart,
    currentPartNumber,
    exitDialogProps,
    headerProps,
    isTestComplete: shellIsTestComplete,
    setShowExitDialog,
    showExitDialog,
    showUpgradeDialog,
    testTitle,
    totalParts,
    upgradeDialogProps,
  } = shellProps;

  return (
    <div className="min-h-screen transition-colors duration-500 bg-background overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] pointer-events-none" />

      <ExitDialog open={showExitDialog} blocker={blocker} {...exitDialogProps} />

      <div className="relative max-w-4xl mx-auto px-2 sm:px-4 py-2 md:py-4">
        <TestHeader
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          totalParts={totalParts}
          testTitle={testTitle}
          isTestComplete={shellIsTestComplete}
          conversationLength={conversationLength}
          onExit={() => setShowExitDialog(true)}
          onShowExitDialog={() => {
            if (!shellIsTestComplete && conversationLength > 1) {
              setShowExitDialog(true);
            } else {
              navigate(createPageUrl('Speaking'));
            }
          }}
          {...headerProps}
        />

        <SpeakingConversationPanel
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          allParts={shellProps.allParts}
          authUser={authUser}
          {...conversationPanelProps}
        />
      </div>

      <UpgradeDialog open={showUpgradeDialog} authUser={authUser} {...upgradeDialogProps} />
    </div>
  );
}
