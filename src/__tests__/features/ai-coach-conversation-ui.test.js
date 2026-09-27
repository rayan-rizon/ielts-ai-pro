import { describe, expect, it } from 'vitest';
import {
  coachFollowUps,
  groupCoachConversations,
} from '@/features/ai-coach/utils/coachConversationUi';

describe('AI Coach conversation prompts', () => {
  it('shows only the latest reply’s distinct, contextual questions', () => {
    expect(
      coachFollowUps([
        { role: 'user', content: 'How do I improve matching headings?' },
        {
          role: 'assistant',
          content: 'Compare the heading with the whole paragraph.',
          follow_ups: ['Can you show a matching headings example?'],
        },
        { role: 'user', content: 'Can you show a matching headings example?' },
        {
          role: 'assistant',
          content: 'Look for the main idea rather than a repeated word.',
          follow_ups: [
            'Can you give me a paragraph to practise the main idea?',
            'Can you give me a paragraph to practise the main idea?',
            'Can you show a matching headings example?',
            'Would you like another matching headings example?',
            'How do I rule out a heading that repeats one word?',
          ],
        },
      ])
    ).toEqual([
      'Can you give me a paragraph to practise the main idea?',
      'How do I rule out a heading that repeats one word?',
    ]);
  });

  it('supports the response language and omits stale templates while awaiting Ava', () => {
    expect(
      coachFollowUps([
        { role: 'user', content: 'বাংলায় বুঝিয়ে দিন' },
        {
          role: 'assistant',
          content: 'বাংলায় উত্তর',
          responseLanguage: 'bn',
          followUps: ['একটি উদাহরণ দেখাবেন?'],
        },
      ])
    ).toEqual(['একটি উদাহরণ দেখাবেন?']);
    expect(coachFollowUps([{ role: 'user', content: 'Help with writing' }])).toEqual([]);
    expect(
      coachFollowUps([{ role: 'assistant', content: 'Old reply without saved questions.' }])
    ).toEqual([]);
  });

  it('groups recent conversations by local calendar day', () => {
    const groups = groupCoachConversations(
      [
        { id: 'today', last_message_at: '2026-09-27T10:00:00' },
        { id: 'week', last_message_at: '2026-09-23T10:00:00' },
        { id: 'older', last_message_at: '2026-09-10T10:00:00' },
      ],
      new Date('2026-09-27T14:00:00')
    );
    expect(groups.map(({ label, items }) => [label, items[0].id])).toEqual([
      ['Today', 'today'],
      ['Previous 7 days', 'week'],
      ['Earlier', 'older'],
    ]);
  });
});
