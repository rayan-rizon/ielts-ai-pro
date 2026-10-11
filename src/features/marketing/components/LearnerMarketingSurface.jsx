import useLearnerMarketing from '@/features/marketing/hooks/useLearnerMarketing';
import LearnerBanner from './LearnerBanner';
import LearnerInAppNotification from './LearnerInAppNotification';

export default function LearnerMarketingSurface({ user, dashboardOnly = false }) {
  const { banner, notification, cardRef, bannerRef, working, handleFeedback, handleClick } =
    useLearnerMarketing({ user, dashboardOnly });

  if (!banner && !notification) {
    return null;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-2 px-4 pt-4 md:px-6">
        <LearnerBanner banner={banner} bannerRef={bannerRef} onDismiss={handleFeedback} />
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
