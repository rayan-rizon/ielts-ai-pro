import { describe, expect, it } from 'vitest';
import {
  applyReportText,
  collectReportText,
  keepSafeTranslations,
  maskQuotes,
} from '../../../supabase/functions/_shared/writingReportText';

const feedback = {
  taskType: 'Task 2',
  summary: 'Your position is clear, but grammar limits the score.',
  criterionNotes: { TaskResponse: 'You answer both views.' },
  priorities: [
    {
      criterion: 'Grammar',
      issue: 'Agreement errors recur.',
      action: 'Check each verb against its subject.',
      evidenceText: 'people is',
    },
  ],
  annotations: [
    {
      originalText: 'people is',
      type: 'grammar',
      severity: 'error',
      suggestion: 'people are',
      explanation: 'A plural subject needs "are".',
    },
    {
      originalText: 'more good',
      type: 'grammar',
      severity: 'error',
      suggestion: 'Use the comparative form of this adjective.',
      replacementText: 'better',
      explanation: 'This adjective has an irregular comparative.',
    },
    {
      originalText: 'many thing',
      type: 'style',
      severity: 'suggestion',
      suggestion: 'Add one concrete example after this claim.',
      explanation: 'The claim is too general.',
    },
  ],
  strengths: ['A clear position is kept throughout.'],
  paragraphNotes: [{ opening: 'Firstly, free education', note: 'The idea needs an example.' }],
  weaknesses: ['The word count is below the minimum.', 'Linking is repetitive.'],
  suggestions: ['Write at least 250 words.', 'Vary how you link ideas.'],
  taskAnalysis: {
    limitations: 'The labels were small.',
    observedFeatures: ['Car use rose sharply'],
  },
};

describe('collecting the explanation text of a writing report', () => {
  const items = collectReportText(feedback);

  it('takes every explanation the learner reads', () => {
    expect(items).toMatchObject({
      summary: feedback.summary,
      'criterionNotes.TaskResponse': 'You answer both views.',
      'priorities.0.issue': 'Agreement errors recur.',
      'priorities.0.action': 'Check each verb against its subject.',
      'annotations.0.explanation': 'A plural subject needs "are".',
      'annotations.2.suggestion': 'Add one concrete example after this claim.',
      'strengths.0': 'A clear position is kept throughout.',
      'paragraphNotes.0.note': 'The idea needs an example.',
      'taskAnalysis.limitations': 'The labels were small.',
      'taskAnalysis.observedFeatures.0': 'Car use rose sharply',
    });
  });

  it('never sends English the learner must copy: corrections, quotes from the essay or labels', () => {
    const values = Object.values(items);
    expect(items).not.toHaveProperty(['annotations.0.suggestion']);
    expect(items).not.toHaveProperty(['annotations.1.suggestion']);
    for (const english of [
      'people is',
      'people are',
      'better',
      'Grammar',
      'Firstly, free education',
    ])
      expect(values).not.toContain(english);
  });

  it('takes the older weakness fields only when the report has no priorities', () => {
    expect(items).not.toHaveProperty(['weaknesses.1']);
    const legacy = collectReportText({ ...feedback, priorities: [] });
    // Word-count notes stay in English so the report can still hide them.
    expect(legacy).not.toHaveProperty(['weaknesses.0']);
    expect(legacy['weaknesses.1']).toBe('Linking is repetitive.');
    expect(legacy['suggestions.1']).toBe('Vary how you link ideas.');
  });

  it('is empty for a report with nothing to explain', () => {
    expect(collectReportText({ overallBand: 6 })).toEqual({});
    expect(collectReportText(null)).toEqual({});
  });
});

describe('applying translated text to a report', () => {
  const translated = applyReportText(feedback, {
    summary: 'আপনার অবস্থান স্পষ্ট।',
    'priorities.0.issue': 'ক্রিয়ার ভুল বারবার হচ্ছে।',
    'annotations.2.suggestion': 'একটি উদাহরণ দিন।',
    'taskAnalysis.observedFeatures.0': 'গাড়ির ব্যবহার বেড়েছে',
    'strengths.7': 'ignored: no such field',
    'annotations.0.originalText': 'ignored: not an explanation',
  });

  it('replaces only the explanation fields it was given', () => {
    expect(translated.summary).toBe('আপনার অবস্থান স্পষ্ট।');
    expect(translated.priorities[0].issue).toBe('ক্রিয়ার ভুল বারবার হচ্ছে।');
    expect(translated.priorities[0].action).toBe('Check each verb against its subject.');
    expect(translated.priorities[0].evidenceText).toBe('people is');
    expect(translated.annotations[2].suggestion).toBe('একটি উদাহরণ দিন।');
    expect(translated.annotations[0].originalText).toBe('people is');
    expect(translated.strengths).toEqual(['A clear position is kept throughout.']);
  });

  it('keeps chart features in English for matching and adds the translation for display', () => {
    expect(translated.taskAnalysis.observedFeatures).toEqual(['Car use rose sharply']);
    expect(translated.taskAnalysis.displayFeatures).toEqual(['গাড়ির ব্যবহার বেড়েছে']);
  });

  it('never changes the saved report it was given', () => {
    expect(feedback.summary).toBe('Your position is clear, but grammar limits the score.');
    expect(feedback.priorities[0].issue).toBe('Agreement errors recur.');
    expect(feedback.taskAnalysis).not.toHaveProperty('displayFeatures');
  });

  it('returns the report unchanged when there is nothing to apply', () => {
    expect(applyReportText(feedback, null)).toBe(feedback);
    expect(applyReportText(feedback, {})).toBe(feedback);
  });
});

describe('checking a translation before a learner sees it', () => {
  const source = {
    a: 'A plural subject needs "are" here.',
    b: 'Check each verb against its subject.',
    c: 'Use ‘however’ only to contrast two ideas.',
    d: 'Well done.',
  };

  it('accepts a translation that keeps quoted English', () => {
    const safe = keepSafeTranslations(
      source,
      {
        a: 'এখানে বহুবচন কর্তার জন্য "are" দরকার।',
        b: 'প্রতিটি ক্রিয়া কর্তার সাথে মিলিয়ে দেখুন।',
        c: 'দুটি ধারণার পার্থক্য দেখাতে শুধু ‘however’ ব্যবহার করুন।',
        d: 'খুব ভালো।',
      },
      'bn'
    );
    expect(Object.keys(safe)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('drops a field whose quoted English was translated or lost', () => {
    const safe = keepSafeTranslations(
      source,
      { a: 'এখানে বহুবচন কর্তার জন্য "আছে" দরকার।', c: 'শুধু ‘তবে’ ব্যবহার করুন।' },
      'bn'
    );
    expect(safe).toEqual({});
  });

  it('drops text that came back in the wrong script or untranslated', () => {
    expect(keepSafeTranslations(source, { b: source.b }, 'hi')).toEqual({});
    expect(keepSafeTranslations(source, { b: 'প্রতিটি ক্রিয়া দেখুন।' }, 'ru')).toEqual({});
    expect(keepSafeTranslations(source, { b: source.b }, 'id')).toEqual({});
    expect(
      keepSafeTranslations(source, { b: 'Cocokkan setiap kata kerja dengan subjeknya.' }, 'id')
    ).toEqual({ b: 'Cocokkan setiap kata kerja dengan subjeknya.' });
    expect(keepSafeTranslations(source, { b: 'ہر فعل کو اس کے فاعل سے ملائیں۔' }, 'ur')).toEqual({
      b: 'ہر فعل کو اس کے فاعل سے ملائیں۔',
    });
  });

  it('drops empty, non-text, runaway and unrequested fields', () => {
    const safe = keepSafeTranslations(
      source,
      { a: '', b: 42 as never, c: 'ব'.repeat(5000), z: 'অতিরিক্ত' },
      'bn'
    );
    expect(safe).toEqual({});
  });
});

describe('protecting quoted English from the translator', () => {
  const source = {
    a: 'Write "people are" and avoid ‘more good’ here.',
    b: "The learner's idea is clear.",
    c: 'No quotes at all.',
  };
  const { masked, restore } = maskQuotes(source);

  it('swaps each quoted English phrase for a placeholder', () => {
    expect(masked.a).toBe('Write [[Q0]] and avoid [[Q1]] here.');
    // An apostrophe is not the start of a quote.
    expect(masked.b).toBe(source.b);
    expect(masked.c).toBe(source.c);
  });

  it('puts the exact English back, marks included, wherever the translator moved it', () => {
    expect(restore({ a: '[[Q1]] এড়িয়ে [[Q0]] লিখুন।', c: 'কোনো উদ্ধৃতি নেই।' })).toEqual({
      a: '‘more good’ এড়িয়ে "people are" লিখুন।',
      c: 'কোনো উদ্ধৃতি নেই।',
    });
  });

  it('drops a field that lost, repeated or invented a placeholder', () => {
    expect(restore({ a: 'শুধু [[Q0]] লিখুন।' })).toEqual({});
    expect(restore({ a: '[[Q0]] [[Q0]] [[Q1]] লিখুন।' })).toEqual({});
    expect(restore({ c: 'অতিরিক্ত [[Q7]]' })).toEqual({});
  });
});
