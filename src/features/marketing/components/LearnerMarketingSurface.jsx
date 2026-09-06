import useLearnerMarketing from '@/features/marketing/hooks/useLearnerMarketing';
import LearnerBanner from './LearnerBanner';
import LearnerCheckIn from './LearnerCheckIn';
import LearnerInAppNotification from './LearnerInAppNotification';

function hasActiveSurface(banner, notification, showCheckIn) {
  if (banner) return true;
  if (notification) return true;
  return Boolean(showCheckIn);
}

export default function LearnerMarketingSurface({ user, dashboardOnly = false }) {
  const {
    banner,
    notification,
    showCheckIn,
    cardRef,
    bannerRef,
    working,
    handleFeedback,
    handleClick,
    handleSaveFeeling,
    handleEnablePush,
  } = useLearnerMarketing({ user, dashboardOnly });

  if (!hasActiveSurface(banner, notification, showCheckIn)) {
    return null;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-4 pt-4 md:px-6">
        <LearnerBanner banner={banner} bannerRef={bannerRef} onDismiss={handleFeedback} />
        {showCheckIn && (
          <LearnerCheckIn
            working={working}
            onSaveFeeling={handleSaveFeeling}
            onEnablePush={handleEnablePush}
          />
        )}
      </div>
      <LearnerInAppNotification
        notification={notification}
        cardRef={cardRef}
        working={working}
        onFeedback={handleFeedback}
        onClick={handleClick}
      />
    </>
  );
}
