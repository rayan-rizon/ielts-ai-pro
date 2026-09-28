import { describe, expect, it } from 'vitest';

import { getVisibleSpeakingConversation } from '@/features/testing/speaking/utils/speakingV2';

const conversation = [
  { speaker: 'ai', text: 'Where do you live?' },
  { speaker: 'user', text: 'I live in Dhaka.' },
  { speaker: 'coach', text: 'Add one specific example.' },
];

describe('Speaking V2 transcript visibility', () => {
  it('hides candidate transcripts and coaching in Exam mode', () => {
    expect(getVisibleSpeakingConversation(conversation, 'exam')).toEqual([
      { speaker: 'ai', text: 'Where do you live?' },
    ]);
  });

  it('shows the transcript in Practice mode; coaching is spoken, not carded', () => {
    expect(getVisibleSpeakingConversation(conversation, 'practice')).toEqual(
      conversation.slice(0, 2)
    );
  });
});
