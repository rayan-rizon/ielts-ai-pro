import { useState } from 'react';
import { toast } from 'sonner';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { translateReport } from './useTranslatedReport';

/** Each task's report in the chosen language; English for any that cannot be translated. */
async function translatedFeedbacks(feedbacks, sessionId, language) {
  const entries = await Promise.all(
    Object.entries(feedbacks || {}).map(async ([task, feedback]) => [
      task,
      feedback
        ? await translateReport(feedback, sessionId, language).catch(() => feedback)
        : feedback,
    ])
  );
  return Object.fromEntries(entries);
}

/** Builds the PDF in the report's language, with any comparisons already opened. */
export function useReportDownload({ t, sessionId, targetBand, comparisons }) {
  const allFeedbacks = useWritingTestStore((state) => state.feedbacks);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { downloadWritingReportPdf } = await import('../utils/writingReportPdf');
      await downloadWritingReportPdf({
        feedbacks: await translatedFeedbacks(allFeedbacks, sessionId, t.language),
        drafts: useWritingTestStore.getState().drafts,
        language: t.language,
        targetBand,
        comparisons: comparisons(),
      });
      toast.success(t('pdfDone'));
    } catch (err) {
      console.error(err);
      toast.error(t('pdfFailed'), { description: t('pdfRetry') });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return { isDownloadingPdf, handleDownloadPdf };
}
