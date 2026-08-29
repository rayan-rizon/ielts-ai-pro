import { describe, expect, it, vi } from 'vitest';

import { playInitialGreeting } from './useStartSpeakingTest';

describe('playInitialGreeting', () => {
  it('shows the welcome and asks the first question without waiting for welcome audio', async () => {
    let conversation = [];
    const speakText = vi.fn().mockResolvedValue(undefined);
    const setConversation = vi.fn((valueOrUpdater) => {
      conversation =
        typeof valueOrUpdater === 'function' ? valueOrUpdater(conversation) : valueOrUpdater;
    });
    const requestAutoStart = vi.fn();
    const firstQuestionInsertedRef = { current: false };
    const pendingGreetingRef = {
      current: {
        greeting: 'Welcome to the speaking test.',
        partNumber: 1,
      },
    };

    const playback = playInitialGreeting({
      allParts: {
        1: {
          questions: 'Do you work or study?\nWhat do you enjoy about it?',
        },
      },
      firstQuestionInsertedRef,
      pendingGreetingRef,
      requestAutoStart,
      setConversation,
      setCurrentQuestionIndex: vi.fn(),
      setTestStarted: vi.fn(),
      speakText,
    });

    await playback;

    expect(conversation).toEqual([
      { speaker: 'ai', text: 'Welcome to the speaking test.' },
      { speaker: 'ai', text: 'Do you work or study?' },
    ]);
    expect(speakText).toHaveBeenCalledOnce();
    expect(speakText).toHaveBeenCalledWith('Do you work or study?');
    expect(firstQuestionInsertedRef.current).toBe(true);
    expect(requestAutoStart).toHaveBeenCalledOnce();
  });
});
