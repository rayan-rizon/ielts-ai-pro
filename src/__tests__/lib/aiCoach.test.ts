import { describe, expect, it } from 'vitest';

import {
  asksForPersonalEvidence,
  detectCoachLanguage,
  estimateCoachInputTokens,
  safeCoachFallbackReply,
  validateCoachReply,
  validateCoachSendBody,
} from '../../../supabase/functions/_shared/aiCoach';

const requestId = '6a2c3432-6f1b-47a7-87e3-a56320f642f1';

describe('personalized AI Coach language selection', () => {
  it.each([
    ['How can I improve my IELTS score?', 'en'],
    ['আমার স্কোর কীভাবে উন্নত করব?', 'bn'],
    ['मेरा स्कोर कैसे सुधरेगा?', 'hi'],
    ['میرا اسکور کیسے بہتر ہوگا؟', 'ur'],
    ['كيف أحسن درجتي؟', 'ar'],
    ['मेरो स्कोर कसरी सुधार गर्ने?', 'ne'],
    ['我怎样提高雅思成绩？', 'zh-CN'],
    ['Tôi nên cải thiện điểm IELTS như thế nào?', 'vi'],
    ['¿Cómo puedo mejorar mi puntuación?', 'es'],
    ['IELTS puanımı nasıl geliştirebilirim?', 'tr'],
  ])('detects %s as %s', (message, expected) => {
    expect(detectCoachLanguage(message).language).toBe(expected);
  });

  it.each([
    ['ami kivabe score improve korbo', 'bn'],
    ['mujhe score kaise improve karna hai', 'hi'],
    ['mujhay score kaise improve karna hai', 'ur'],
    ['Como puedo mejorar mi puntuacion', 'es'],
    ['Puanimi nasil gelistirebilirim', 'tr'],
    ['Toi lam sao de cai thien diem cua minh', 'vi'],
  ])('recognizes romanized learner questions', (message, expected) => {
    expect(detectCoachLanguage(message).language).toBe(expected);
  });

  it('recognizes a plain English statement without relying on a saved preference', () => {
    expect(detectCoachLanguage('Please review my writing conclusion.', 'bn')).toMatchObject({
      language: 'en',
      source: 'message',
      ambiguous: false,
    });
  });

  it('honors an explicit language request over English example text', () => {
    expect(detectCoachLanguage('Explain this English sentence in Bangla').language).toBe('bn');
  });

  it('uses the saved preference only for an ambiguous message', () => {
    expect(detectCoachLanguage('42?', 'es')).toMatchObject({
      language: 'es',
      source: 'preference',
      ambiguous: true,
    });
  });

  it('does not let a pasted English answer override a non-English explanation preference', () => {
    expect(
      detectCoachLanguage(
        'Some people believe that university education should be free for every student.',
        'bn'
      ).language
    ).toBe('bn');
  });

  it.each([
    ['Please explain this in French', 'French'],
    ['Pouvez-vous expliquer cette phrase?', 'French'],
    ['Объясните мою ошибку', 'a Cyrillic language'],
    ['日本語で説明してください', 'Japanese'],
  ])('reports unsupported language input without guessing: %s', (message, unsupportedLanguage) => {
    expect(detectCoachLanguage(message)).toMatchObject({
      source: 'unsupported',
      ambiguous: false,
      unsupportedLanguage,
    });
  });

  it.each([
    'Explain my latest score.',
    'আমার স্কোর কেন কম?',
    'मेरा स्कोर कैसे सुधरेगा?',
    'میرا اسکور کیوں کم ہے؟',
    'كيف أحسن درجتي؟',
    'मेरो नतिजा कस्तो छ?',
    '我的成绩进步了吗？',
    'Điểm của tôi có tiến bộ không?',
    '¿Mejoró mi puntuación?',
    'Puanım gelişti mi?',
  ])('recognizes a personal-data question in supported languages', (message) => {
    expect(asksForPersonalEvidence(message)).toBe(true);
  });
});

describe('personalized AI Coach request and reply validation', () => {
  it('uses a conservative multilingual input estimate', () => {
    expect(estimateCoachInputTokens('a'.repeat(400))).toBe(100);
    expect(estimateCoachInputTokens('বাংলা')).toBeGreaterThan(5);
  });

  it('accepts a bounded send request', () => {
    expect(
      validateCoachSendBody({ requestId, message: 'Help me practise conclusions.' })
    ).toMatchObject({ requestId, preferredLanguage: 'en' });
  });

  it('rejects an overlong learner message', () => {
    expect(() => validateCoachSendBody({ requestId, message: 'x'.repeat(2001) })).toThrow(
      '2000 characters'
    );
  });

  it('rejects unsupported contextual source types', () => {
    expect(() =>
      validateCoachSendBody({
        requestId,
        message: 'Help me with this.',
        sourceReference: { type: 'learning_activity', id: requestId },
      })
    ).toThrow('Invalid source reference');
  });

  it('accepts only evidence IDs supplied by the server', () => {
    const reply = {
      answer: 'Your latest completed result is Band 6.5.',
      responseLanguage: 'en',
      groundingStatus: 'supported',
      evidenceRefs: [{ id: 'result:latest', claim: 'Latest completed result is Band 6.5.' }],
      exercise: null,
      actions: [],
    };
    expect(validateCoachReply(reply, new Set(['result:latest']))).toBe(true);
    expect(validateCoachReply(reply, new Set())).toBe(false);
  });

  it('validates deterministic multiple-choice exercises', () => {
    const reply = {
      answer: 'Choose the clearer sentence.',
      responseLanguage: 'en',
      groundingStatus: 'general',
      evidenceRefs: [],
      exercise: {
        kind: 'multiple_choice',
        prompt: 'Which sentence is correct?',
        options: ['It depends on the result.', 'It depends of the result.'],
        answerIndex: 0,
        explanation: 'Use “depends on”.',
      },
      actions: [],
    };
    expect(validateCoachReply(reply, new Set())).toBe(true);
    expect(
      validateCoachReply({ ...reply, exercise: { ...reply.exercise, answerIndex: 4 } }, new Set())
    ).toBe(false);
  });

  it('rejects unsupported future band promises and invented deadlines', () => {
    const base = {
      responseLanguage: 'en',
      groundingStatus: 'general',
      evidenceRefs: [],
      exercise: null,
      actions: [],
    };

    expect(
      validateCoachReply(
        {
          ...base,
          answer: 'I can guide you with tips to reach band 7 by your test date.',
        },
        new Set()
      )
    ).toBe(false);
    expect(
      validateCoachReply(
        { ...base, answer: 'Band 7 writing usually needs a clear, developed position.' },
        new Set()
      )
    ).toBe(true);
  });

  it('rejects raw evidence IDs or citation JSON inside the learner answer', () => {
    const reply = {
      answer: 'Your target is band 7 【{"id":"goal:target-band","claim":"target band 7"}].',
      responseLanguage: 'en',
      groundingStatus: 'supported',
      evidenceRefs: [{ id: 'goal:target-band', claim: 'Target band is 7.' }],
      exercise: null,
      actions: [],
    };

    expect(validateCoachReply(reply, new Set(['goal:target-band']))).toBe(false);
  });

  it.each(['en', 'bn', 'hi', 'ur', 'ar', 'ne', 'zh-CN', 'vi', 'es', 'tr'] as const)(
    'provides a safe deterministic fallback in %s',
    (language) => {
      const reply = safeCoachFallbackReply(language);
      expect(reply.responseLanguage).toBe(language);
      expect(reply.answer).toBeTruthy();
      expect(validateCoachReply(reply, new Set())).toBe(true);
    }
  );
});
