import { describe, expect, it, vi } from 'vitest';

import { playInitialGreeting } from './useStartSpeakingTest';

describe('playInitialGreeting', () => {
  it('plays the welcome announcement before the first question', async () => {
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
    expect(speakText).toHaveBeenCalledTimes(2);
    expect(speakText).toHaveBeenNthCalledWith(1, 'Welcome to the speaking test.');
    expect(speakText).toHaveBeenNthCalledWith(2, 'Do you work or study?');
    expect(firstQuestionInsertedRef.current).toBe(true);
    expect(requestAutoStart).toHaveBeenCalledOnce();
  });

  it('opens practice mode as a coach, not as the examiner', async () => {
    const speakText = vi.fn().mockResolvedValue(undefined);
    await playInitialGreeting({
      allParts: { 1: { questions: 'Do you work or study?' } },
      firstQuestionInsertedRef: { current: false },
      pendingGreetingRef: {
        current: {
          greeting: "I'm your AI examiner.",
          practiceGreeting: "Hi! Let's practise Part 1 together.",
          partNumber: 1,
        },
      },
      setConversation: vi.fn(),
      setCurrentQuestionIndex: vi.fn(),
      setTestStarted: vi.fn(),
      speakingMode: 'practice',
      speakText,
    });
    expect(speakText).toHaveBeenNthCalledWith(1, "Hi! Let's practise Part 1 together.");
  });

  it('shows the first question only after the greeting has finished', async () => {
    let conversation = [];
    let finishGreeting;
    const speakText = vi.fn((text) =>
      text === 'Welcome.' ? new Promise((resolve) => (finishGreeting = resolve)) : Promise.resolve()
    );
    const setConversation = vi.fn((valueOrUpdater) => {
      conversation =
        typeof valueOrUpdater === 'function' ? valueOrUpdater(conversation) : valueOrUpdater;
    });
    const playback = playInitialGreeting({
      allParts: { 1: { questions: 'Do you work or study?' } },
      firstQuestionInsertedRef: { current: false },
      pendingGreetingRef: { current: { greeting: 'Welcome.', partNumber: 1 } },
      setConversation,
      setCurrentQuestionIndex: vi.fn(),
      setTestStarted: vi.fn(),
      speakText,
    });
    await Promise.resolve();
    expect(conversation).toEqual([{ speaker: 'ai', text: 'Welcome.' }]);

    finishGreeting();
    await playback;
    expect(conversation.map((entry) => entry.text)).toEqual(['Welcome.', 'Do you work or study?']);
  });
});
