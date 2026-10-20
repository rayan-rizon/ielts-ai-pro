import { describe, expect, it } from 'vitest';
import {
  answerItems,
  answerNotes,
  isAnswerSection,
  parseGrammarGuide,
} from '@/features/grammar/components/guide/grammarGuideParser';

const answerSectionOf = (markdown) => parseGrammarGuide(markdown).find(isAnswerSection);

describe('grammar guide parser: answer keys', () => {
  it('splits a run-on key written as "1 text. 2 text." into one item per question', () => {
    const section = answerSectionOf(`
### Practice 10

Combine each pair.

1. First pair.
2. Second pair.
3. Third pair.

## Answer key

1 _The first answer, in 2019._ 2 _The second answer._ 3 _The third answer._
`);
    const items = answerItems(section);
    expect(items.map((item) => item.number)).toEqual([1, 2, 3]);
    expect(items[0].answer).toBe('_The first answer, in 2019._');
    expect(items[2].question).toBe('Third pair.');
  });

  it('splits semicolon keys and does not treat a digit inside an answer as a marker', () => {
    const section = answerSectionOf(`
### Practice 13

Correct the comparison.

1. One.
2. Two.
3. Three.

## Answer key

1 _lower_; 2 _fewer students_; 3 _twice as high as / double the level in 2000_
`);
    const items = answerItems(section);
    expect(items.map((item) => item.answer)).toEqual([
      '_lower_',
      '_fewer students_',
      '_twice as high as / double the level in 2000_',
    ]);
  });

  it('reads a numbered-list key and keeps bullets beside it as notes, not answers', () => {
    const section = answerSectionOf(`
### Practice 17

Rewrite each claim.

1. Claim one.
2. Claim two.

## Model answers

1. _Model one._
2. _Model two._

- Limit the group.
- Add a condition.
`);
    expect(answerItems(section).map((item) => item.answer)).toEqual([
      '_Model one._',
      '_Model two._',
    ]);
    expect(answerNotes(section).map((block) => block.value)).toEqual([
      'Limit the group.',
      'Add a condition.',
    ]);
  });

  it('pairs several exercises with their own answer sections in reading order', () => {
    const sections = parseGrammarGuide(`
Intro line.

### Practice A: First

Do the first.

1. A one.

### Practice B: Second

Do the second.

1. B one.

### Speaking drills

1. Say something.

## Answers A

1. _A model._

## Answers B

1. _B model._
`);
    const [a, b] = sections.filter(isAnswerSection);
    expect(a.practiceContext.title).toBe('Practice A: First');
    expect(b.practiceContext.title).toBe('Practice B: Second');
    expect(answerItems(b)[0].question).toBe('B one.');

    const body = sections[0].blocks.map((block) => block.value);
    expect(body).toContain('Speaking drills');
    expect(body).toContain('Say something.');
    expect(body).not.toContain('A one.');
  });

  it('keeps lesson text that follows a practice instead of discarding it', () => {
    const [body] = parseGrammarGuide(`
### Practice: Check

Do it.

1. One.

Extra paragraph after the questions.

## Answer key

1. _Done._
`);
    expect(body.blocks.map((block) => block.value)).toContain(
      'Extra paragraph after the questions.'
    );
  });
});
