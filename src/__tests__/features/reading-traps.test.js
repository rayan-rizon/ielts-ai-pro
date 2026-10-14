import { describe, it, expect } from 'vitest';
import annotations from '../../features/testing/reading/utils/readingTrapAnnotations.json';
import { withReadingTraps } from '../../features/testing/reading/utils/readingTraps';
import { readingTrapFingerprint } from '../../features/testing/reading/utils/readingTrapFingerprint';

describe('reviewed Reading trap catalogue', () => {
  it('keeps every annotation fingerprint and learner note compact', () => {
    expect(Object.keys(annotations).length).toBeGreaterThan(600);
    let traps = 0,
      tempting = 0;
    for (const reviewed of Object.values(annotations)) {
      expect(reviewed.fingerprint).toMatch(/^[a-f0-9]{1,8}$/);
      for (const note of Object.values(reviewed.notes)) {
        traps++;
        if (note.tempting_answer) tempting++;
        expect(note.trap.length).toBeLessThanOrEqual(110);
        expect(note.trap.split(/\s+/).length).toBeLessThanOrEqual(18);
      }
    }
    expect(traps).toBe(1477);
    expect(tempting).toBe(631);
  });
  it('attaches notes immutably and suppresses them when source, options, key or explanation changes', () => {
    const source = 'A few trees can create shade and change a microclimate.';
    const question = {
      id: 'synthetic-question',
      section: 1,
      question_number: 1,
      question_text: 'What can create shade?',
      type: 'short_answer',
      correct_answer: 'trees',
      options: ['trees', 'flowers'],
      explanation_data: { correct_answer: 'trees', why_correct: 'The passage names trees.' },
    };
    const test = { sections: [{ section_number: 1, content: source }] };
    const reviewed = {
      [question.id]: {
        fingerprint: readingTrapFingerprint(question, source),
        notes: { 1: { trap: 'Do not confuse shade with shelter.', tempting_answer: 'flowers' } },
      },
    };
    const output = withReadingTraps(question, test, reviewed);
    expect(output.explanation_data.trap).toBe(reviewed[question.id].notes[1].trap);
    expect(question.explanation_data.trap).toBeUndefined();
    for (const changed of [
      { ...question, correct_answer: 'changed' },
      { ...question, options: ['changed'] },
      { ...question, explanation_data: { ...question.explanation_data, why_correct: 'changed' } },
    ])
      expect(withReadingTraps(changed, test, reviewed)).toBe(changed);
    const changedTest = structuredClone(test);
    changedTest.sections[0].content += ' changed';
    expect(withReadingTraps(question, changedTest, reviewed)).toBe(question);
  });
});
