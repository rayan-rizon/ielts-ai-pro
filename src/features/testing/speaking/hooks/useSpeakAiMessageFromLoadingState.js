import { useCallback } from 'react';

export default function useSpeakAiMessageFromLoadingState({ setConversation, speakText }) {
  return useCallback(
    (message) => {
      setConversation((prev) => {
        const updated = [...prev];
        const idx = updated.findLastIndex((entry) => entry.isLoading && entry.speaker === 'ai');

        if (idx !== -1) {
          updated[idx] = { speaker: 'ai', text: message, isLoading: false };
        } else if (!updated.some((entry) => entry.text === message)) {
          updated.push({ speaker: 'ai', text: message });
        }

        return updated;
      });

      return speakText(message, { cancel: true });
    },
    [setConversation, speakText]
  );
}
