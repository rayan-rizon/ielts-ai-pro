import { describe, it, expect } from 'vitest';
import { cn, getQuestionCount, formatInstructionHTML, formatTestTitle } from '@/lib/utils';

describe('cn (className utility)', () => {
    it('should merge class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
        expect(cn('base', true && 'active')).toBe('base active');
        expect(cn('base', false && 'inactive')).toBe('base');
    });

    it('should merge Tailwind classes correctly', () => {
        // Later classes should override earlier conflicting ones
        expect(cn('px-2', 'px-4')).toBe('px-4');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle undefined and null values', () => {
        expect(cn('base', undefined, 'active')).toBe('base active');
        expect(cn('base', null, 'active')).toBe('base active');
    });

    it('should handle arrays', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
        expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('should handle objects', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });
});

describe('getQuestionCount', () => {
    it('should return 0 for null/undefined', () => {
        expect(getQuestionCount(null)).toBe(0);
        expect(getQuestionCount(undefined)).toBe(0);
    });

    it('should handle gap_fill type', () => {
        const gapFillQuestion = {
            type: 'gap_fill' as const,
            gap_fill: {
                text: 'The answer is [gap] and also [gap] and [gap].',
                question_count: 3,
            },
        };
        expect(getQuestionCount(gapFillQuestion)).toBe(3);
    });

    it('should count [gap] markers for gap_fill', () => {
        const question = {
            type: 'gap_fill' as const,
            gap_fill: {
                text: 'Fill [gap] in the [gap] blanks.',
            },
        };
        expect(getQuestionCount(question)).toBe(2);
    });

    it('should handle sentence_completion with range', () => {
        const question = {
            type: 'sentence_completion' as const,
            question_number: '21-25',
        };
        expect(getQuestionCount(question)).toBe(5);
    });

    it('should handle sentence_completion with single number', () => {
        const question = {
            type: 'sentence_completion' as const,
            question_number: '23',
        };
        expect(getQuestionCount(question)).toBe(1);
    });

    it('should count blanks for sentence_completion without question_number', () => {
        const question = {
            type: 'sentence_completion' as const,
            question_text: 'Fill _____ the _____ blanks.',
        };
        expect(getQuestionCount(question)).toBe(2);
    });

    it('should handle table_completion', () => {
        const question = {
            type: 'table_completion' as const,
            table_data: {
                blanks: ['a', 'b', 'c'],
            },
        };
        expect(getQuestionCount(question)).toBe(3);
    });

    it('should use blank_positions for table_completion', () => {
        const question = {
            type: 'table_completion' as const,
            table_data: {
                blank_positions: [{}, {}, {}, {}],
            },
        };
        expect(getQuestionCount(question)).toBe(4);
    });

    it('should handle matching_headings', () => {
        const question = {
            type: 'matching_headings' as const,
            matching_data: {
                paragraphs: ['A', 'B', 'C', 'D'],
            },
        };
        expect(getQuestionCount(question)).toBe(4);
    });

    it('should handle matching_features', () => {
        const question = {
            type: 'matching_features' as const,
            matching_features: {
                questions: ['Q1', 'Q2', 'Q3'],
            },
        };
        expect(getQuestionCount(question)).toBe(3);
    });

    it('should handle matching type with options', () => {
        const question = {
            type: 'matching' as const,
            options: ['A', 'B', 'C'],
        };
        expect(getQuestionCount(question)).toBe(3);
    });

    it('should handle flowchart type', () => {
        const question = {
            type: 'flowchart' as const,
            flowchart: {
                steps: [
                    { text: 'Step [gap] here' },
                    { text: 'Another [gap] and [gap]' },
                ],
            },
        };
        expect(getQuestionCount(question)).toBe(3);
    });

    it('should handle multiple_choice with question_count', () => {
        const question = {
            type: 'multiple_choice' as const,
            allow_multiple: true,
            question_count: 3,
        };
        expect(getQuestionCount(question)).toBe(3);
    });

    it('should default to 1 for unknown types', () => {
        expect(getQuestionCount({ type: 'unknown_type' } as any)).toBe(1);
    });
});

describe('formatInstructionHTML', () => {
    it('should return empty string for null/undefined', () => {
        expect(formatInstructionHTML(null)).toBe('');
        expect(formatInstructionHTML(undefined)).toBe('');
        expect(formatInstructionHTML('')).toBe('');
    });

    it('should convert newlines to paragraph tags', () => {
        const result = formatInstructionHTML('Line 1\nLine 2');
        expect(result).toContain('<p class="mb-2">Line 1</p>');
        expect(result).toContain('<p class="mb-0">Line 2</p>');
    });

    it('should convert markdown-style bold', () => {
        const result = formatInstructionHTML('This is **bold** text');
        expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert markdown-style italic', () => {
        const result = formatInstructionHTML('This is *italic* text');
        expect(result).toContain('<em>italic</em>');
    });

    it('should convert underscore-style underline', () => {
        const result = formatInstructionHTML('This is __underlined__ text');
        expect(result).toContain('<u>underlined</u>');
    });

    it('should convert image tags', () => {
        const result = formatInstructionHTML('[image]https://example.com/img.jpg[/image]');
        expect(result).toContain('src="https://example.com/img.jpg"');
        expect(result).toContain('<img');
    });

    it('should handle tabs', () => {
        const result = formatInstructionHTML('Indented\\ttext');
        expect(result).toContain('&nbsp;');
    });

    it('should sanitize to prevent XSS', () => {
        const malicious = '<script>alert("xss")</script>';
        const result = formatInstructionHTML(malicious);
        expect(result).not.toContain('<script');
    });
});

describe('formatTestTitle', () => {
    it('should return empty string for null/undefined', () => {
        expect(formatTestTitle(null)).toBe('');
        expect(formatTestTitle(undefined)).toBe('');
    });

    it('should return title for non-Cambridge tests', () => {
        const test = { title: 'Practice Test 1' };
        expect(formatTestTitle(test)).toBe('Practice Test 1');
    });

    it('should format Cambridge test titles correctly', () => {
        const test = {
            is_official_cambridge: true,
            cambridge_year: 2020,
            cambridge_test_number: 1,
            title: 'IELTS 15 Academic',
        };
        // bookNumber = year - 2005 = 2020 - 2005 = 15
        expect(formatTestTitle(test)).toBe('IELTS 15 • Test 1 (2020)');
    });

    it('should handle different Cambridge years', () => {
        const test2018 = {
            is_official_cambridge: true,
            cambridge_year: 2018,
            cambridge_test_number: 2,
            title: 'IELTS 13 Academic',
        };
        // bookNumber = 2018 - 2005 = 13
        expect(formatTestTitle(test2018)).toBe('IELTS 13 • Test 2 (2018)');
    });

    it('should fallback to title if Cambridge fields are missing', () => {
        const incompleteTest = {
            is_official_cambridge: true,
            title: 'Fallback Title',
        };
        expect(formatTestTitle(incompleteTest)).toBe('Fallback Title');
    });

    it('should detect General Training from title', () => {
        const gtTest = {
            is_official_cambridge: true,
            cambridge_year: 2022,
            cambridge_test_number: 3,
            title: 'IELTS 17 General Training Reading',
        };
        // 2022 - 2005 = 17
        expect(formatTestTitle(gtTest)).toBe('IELTS 17 GT • Test 3 (2022)');
    });
});
