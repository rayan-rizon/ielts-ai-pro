import { describe, expect, it } from 'vitest';
import {
  grammarContextPresentation,
  grammarQuestionPresentation,
} from '@/features/grammar/constants';

describe('Grammar Lab question presentation', () => {
  it('separates a legacy verbose prompt into a short instruction and sentence', () => {
    const presentation = grammarQuestionPresentation({
      questionFormat: 'sentence_completion',
      prompt:
        'Complete this Academic IELTS Writing task 2 sentence about education policy with the missing grammatical form: “University education should remain affordable. ___, students can reasonably share some of the cost.”',
      options: ['However', 'Although', 'Because'],
    });

    expect(presentation.instruction).toBe('Choose the option that completes the sentence.');
    expect(presentation.sentence).toBe(
      'University education should remain affordable. ___, students can reasonably share some of the cost.'
    );
    expect(presentation.sentence).not.toContain('Academic IELTS Writing task 2');
  });

  it('keeps the IELTS task as context rather than required topic knowledge', () => {
    expect(
      grammarContextPresentation({
        module: 'writing',
        task: 'task_2',
        scenario: 'education policy position',
      })
    ).toEqual({
      moduleLabel: 'Writing',
      taskLabel: 'Task 2',
      scenario: 'Education Policy Position',
      shortLabel: 'Writing · Task 2',
    });
  });
});
