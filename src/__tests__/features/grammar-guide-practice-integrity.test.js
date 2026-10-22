import { describe, expect, it } from 'vitest';
import { GRAMMAR_GUIDES } from '@/features/grammar/data/grammarGuideCatalog';
import {
  answerItems,
  isAnswerSection,
  parseGrammarGuide,
} from '@/features/grammar/components/guide/grammarGuideParser';

describe('guide practice integrity', () => {
  it.each(GRAMMAR_GUIDES.map((guide) => [guide.slug, guide]))(
    '%s renders one answer card per practice question',
    (_slug, guide) => {
      const sections = parseGrammarGuide(guide.content_markdown);
      const answerSections = sections.filter(isAnswerSection);

      answerSections.forEach((section) => {
        const questions = section.practiceContext?.questions ?? [];
        const items = answerItems(section);
        expect(questions.length, `${guide.slug}: practice questions found`).toBeGreaterThan(0);
        expect(items.length, `${guide.slug}: answers vs questions`).toBe(questions.length);
        items.forEach((item) => {
          expect(item.answer.trim(), `${guide.slug} answer ${item.number}`).not.toBe('');
          expect(item.question, `${guide.slug} question ${item.number}`).not.toBe('');
        });
      });
    }
  );
});
