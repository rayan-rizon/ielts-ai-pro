import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { sanitizeHtml } from '@/lib/security';
import { Question } from '@/types';

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Format a band score value to a consistent one decimal place string.
 * Returns '0.0' for invalid inputs.
 */
export function formatBand(value: number | string | null | undefined): string {
    const v = Number(value);
    if (!Number.isFinite(v)) return '0.0';
    return v.toFixed(1);
}

/**
 * Normalizes and proxies image URLs to bypass hotlinking protection (especially for jumpinto.com)
 */
export const getProxiedImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    let finalUrl = url.trim();
    if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;

    // Fix for Safari and Hotlink protection: Use a proxy for external images
    if (finalUrl.includes('jumpinto.com')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(finalUrl)}`;
    }

    return finalUrl;
};

export const getQuestionCount = (q: Question | null | undefined): number => {
    if (!q) return 0;

    // Handle gap_fill type (used in listening tests)
    if (q.type === 'gap_fill') {
        // Check explicit question_count first
        if (q.gap_fill?.question_count) return parseInt(String(q.gap_fill.question_count)) || 0;
        // Fallback: count [gap] markers in text
        const text = q.gap_fill?.text || q.gap_fill?.content || '';
        const matches = text.match(/\[gap\]/gi);
        return matches ? matches.length : 0;
    }

    // Prioritize explicit question_number ranges or single numbers
    // e.g. "21-25" -> 5 questions
    // e.g. "23" -> 1 question (even if multiple blanks)
    if (
        [
            'sentence_completion',
            'summary_completion',
            'note_completion',
            'notes_completion',
            'flow_chart_completion',
            'diagram_completion',
            'short_answer',
        ].includes(q.type)
    ) {
        if (q.question_number) {
            // Check for range like "21-25" or "21- 25"
            // Ensure string for match
            const qNumStr = String(q.question_number);
            const rangeMatch = qNumStr.match(/(\d+)\s*-\s*(\d+)/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                return Math.max(1, end - start + 1);
            }
            // Single number "23" -> count as 1, overriding blank count
            if (qNumStr.match(/\d+/)) {
                // Exception: distinct questions grouped under one number (e.g. Notes/Summary with gap_fill)
                // If we have explicit structured gaps, trust them over the single Question Number container
                if (q.gap_fill) {
                    const gapCount =
                        q.gap_fill.gap_count || (q.gap_fill.structured_text?.match(/\[\d+\]/g) || []).length;
                    if (gapCount > 1) return gapCount;
                }
                return 1;
            }
        }

        // Fallback to blank counting if no question numbers
        const text = q.question_text || q.text || '';
        const blankCount = (text.match(/_____/g) || []).length;
        // For note_completion, check structured text
        if (q.type.includes('note')) {
            return (
                q.gap_fill?.gap_count ||
                (q.gap_fill?.structured_text?.match(/\[\d+\]/g) || []).length ||
                Math.max(blankCount, 1)
            );
        }
        return Math.max(blankCount, 1);
    }

    // Other types
    if (q.type === 'table_completion') {
        // Count UNIQUE blank numbers, not total occurrences
        // e.g., __BLANK_7__ and __BLANK_7__ should count as 1 question (question 7)

        // First, check explicit blanks array
        if (q.table_data?.blanks?.length) {
            // Count unique blankNumbers in the blanks array
            const uniqueBlankNumbers = new Set(
                q.table_data.blanks.map((b: any) => b.blankNumber).filter((n: any) => n != null)
            );
            if (uniqueBlankNumbers.size > 0) return uniqueBlankNumbers.size;
            // Fallback to array length if no blankNumbers
            return q.table_data.blanks.length;
        }

        if (q.table_data?.blank_positions?.length) {
            const uniqueBlankNumbers = new Set(
                q.table_data.blank_positions.map((b: any) => b.blankNumber).filter((n: any) => n != null)
            );
            if (uniqueBlankNumbers.size > 0) return uniqueBlankNumbers.size;
            return q.table_data.blank_positions.length;
        }

        if (typeof q.table_data?.blanks_count === 'number') return q.table_data.blanks_count;

        // Fallback: count unique __BLANK_N__ markers in table rows
        const rows = q.table_data?.table_rows || q.table_data?.rows || [];
        const uniqueBlankNumbers = new Set<number>();

        rows.forEach((row: any) => {
            if (Array.isArray(row)) {
                row.forEach((cell: any) => {
                    const cellStr = String(cell);
                    // Find all __BLANK_N__ patterns and extract unique N values
                    const blankMatches = cellStr.match(/__BLANK_(\d+)__/g);
                    if (blankMatches) {
                        blankMatches.forEach((match: string) => {
                            const num = parseInt(match.match(/__BLANK_(\d+)__/)![1]);
                            uniqueBlankNumbers.add(num);
                        });
                    }
                    // Legacy [gap] markers count as individual questions
                    const gapMatches = cellStr.match(/\[gap\]/gi);
                    if (gapMatches) {
                        // For legacy gaps, we can't determine uniqueness, so count each
                        gapMatches.forEach((_: string, idx: number) => {
                            uniqueBlankNumbers.add(-(idx + 1)); // Use negative to avoid collision
                        });
                    }
                    // Empty cells as potential gaps
                    if (cellStr.trim() === '' && !cellStr.match(/\[gap\]|__BLANK_/i)) {
                        uniqueBlankNumbers.add(-(rows.indexOf(row) * 100 + row.indexOf(cell)));
                    }
                });
            }
        });

        return uniqueBlankNumbers.size || 0;
    }

    if (q.type === 'matching_headings') {
        if (q.matching_data?.paragraphs) return q.matching_data.paragraphs.length;
        if (q.questions) return q.questions.length;
        if (q.options) return q.options.length; // fallback
        return 1;
    }

    if (q.type === 'matching_features') {
        if (q.matching_features?.mode === 'paragraph' && q.matching_features.answers) {
            return Object.keys(q.matching_features.answers).length;
        }
        if (q.matching_features?.questions) return q.matching_features.questions.length;
        if (q.questions) return q.questions.length; // Nested
        if (q.options) return q.options.length; // fallback
        return 1;
    }

    if (q.type === 'matching') {
        if (q.options) return q.options.length;
        return 1;
    }

    if (
        q.type === 'flow_chart_completion' ||
        q.type === 'flowchart' ||
        q.type === 'diagram_label_completion' ||
        q.type === 'diagram_completion'
    ) {
        if (q.flowchart?.steps) {
            return (
                q.flowchart.steps.reduce(
                    (acc, step) => acc + (step.text.match(/\[gap\]/g) || []).length,
                    0
                ) || 0
            );
        }
        if (q.gap_fill?.question_count) return parseInt(String(q.gap_fill.question_count)) || 0;
    }

    if (q.type === 'map_labeling') {
        if (q.map_labeling?.questions) return q.map_labeling.questions.length;
        if (q.map_labeling?.items) return q.map_labeling.items.length;
    }

    if (q.type === 'multiple_choice') {
        // Check explicit question_count first (most reliable)
        if (q.question_count) {
            return parseInt(String(q.question_count));
        }
        // Check for question_number range like "23-24" or "25-26"
        if (q.question_number) {
            const qNumStr = String(q.question_number);
            const rangeMatch = qNumStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                return Math.max(1, end - start + 1);
            }
        }
        // Fallback for allow_multiple without explicit count
        if (q.allow_multiple) {
            // Default to 2 for "choose two" style questions if no other info
            return 2;
        }
        return 1;
    }

    return 1;
};

/**
 * Format instruction text with HTML and sanitize output to prevent XSS.
 * Formats questions to match official IELTS paper styling.
 * @param text - Raw instruction text
 * @returns - Sanitized HTML string
 */
export const formatInstructionHTML = (text: string | null | undefined): string => {
    if (!text) return '';

    // Convert to string if not already
    const content = String(text);

    // Normalize line endings
    let processed = content
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
    processed = processed.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    // Split into lines for processing
    const lines = processed.split('\n').filter(line => line.trim());

    // Detect T/F/NG or Y/N/NG lines
    const tfngLineIndices: number[] = [];
    const isTFNG = lines.some(l => /^\s*(TRUE|FALSE|NOT GIVEN)\s+if\b/i.test(l));
    const isYNNG = lines.some(l => /^\s*(YES|NO|NOT GIVEN)\s+if\b/i.test(l));

    if (isTFNG || isYNNG) {
        lines.forEach((line, idx) => {
            if (isTFNG && /^\s*(TRUE|FALSE|NOT GIVEN)\s+if\b/i.test(line)) {
                tfngLineIndices.push(idx);
            } else if (isYNNG && /^\s*(YES|NO|NOT GIVEN)\s+if\b/i.test(line)) {
                tfngLineIndices.push(idx);
            }
        });
    }

    // If we found T/F/NG lines, format them specially
    if (tfngLineIndices.length >= 2) {
        const introLines = lines.slice(0, tfngLineIndices[0]);
        const defLines = lines.slice(tfngLineIndices[0]);

        // Format intro
        let introFormatted = introLines.map(line => {
            let formatted = line
                .replace(/\b(Questions?\s+\d+(?:\s*[-–—]\s*\d+)?)\b/gi, '<strong>$1</strong>')
                .replace(/\bboxes?\s+(\d+[-–—]\d+)\b/gi, 'boxes <strong>$1</strong>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/\[image\](.*?)\[\/image\]/g, (_match, url) => {
                    const finalUrl = getProxiedImageUrl(url);
                    return `<img src="${finalUrl}" alt="IELTS Instruction Image" class="max-w-full h-auto mx-auto my-4 border rounded shadow-sm" />`;
                });
            return `<p class="mb-3">${formatted}</p>`;
        }).join('');

        // Parse definitions
        let definitionsList = '<div class="mt-4 ml-4 space-y-2">';
        defLines.forEach(line => {
            const match = line.match(/^\s*(TRUE|FALSE|NOT GIVEN|YES|NO)\s+if\s+(.+)$/i);
            if (match) {
                const term = match[1].toUpperCase();
                const desc = match[2].trim();
                definitionsList += `<div class="flex items-baseline"><span class="font-bold italic min-w-[100px] shrink-0">${term}</span><span class="italic text-slate-600 dark:text-slate-400 ml-6">if ${desc}</span></div>`;
            }
        });
        definitionsList += '</div>';

        return sanitizeHtml(`${introFormatted}${definitionsList}`);
    }

    // Standard formatting for other instructions
    const formattedLines = lines.map(line => {
        return line
            .replace(/\b(Questions?\s+\d+(?:\s*[-–—]\s*\d+)?)\b/gi, '<strong>$1</strong>')
            .replace(/\b([A-Z])\s*[-–—]\s*([A-Z])\b/g, '<strong>$1-$2</strong>')
            .replace(/\b(ONE WORD|TWO WORDS|THREE WORDS|NO MORE THAN TWO WORDS|NO MORE THAN THREE WORDS|NO MORE THAN ONE WORD)\b/gi, '<strong>$1</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/\[image\](.*?)\[\/image\]/g, (_match, url) => {
                const finalUrl = getProxiedImageUrl(url);
                return `<img src="${finalUrl}" alt="IELTS Instruction Image" class="max-w-full h-auto mx-auto my-4 border rounded shadow-sm" />`;
            });
    });

    // Join with paragraph tags for proper spacing, no <br /> needed if using <p>
    const result = formattedLines.map((line, idx) => {
        // Last line doesn't need margin
        const isLast = idx === formattedLines.length - 1;
        return `<p class="${isLast ? 'mb-0' : 'mb-2'}">${line}</p>`;
    }).join('');

    return sanitizeHtml(result);
};




export const formatTestTitle = (test: any): string => {
    if (!test) return '';

    // Check if it's a Cambridge test with year and test number logic
    // We're lenient here: if it has year and test number, we treat it as official if not explicitly false
    const isOfficial = test.is_official_cambridge !== false && (test.cambridge_year || test.cambridge_test_number);

    if (isOfficial && test.cambridge_year && test.cambridge_test_number) {
        const year = test.cambridge_year;
        const testNum = test.cambridge_test_number;
        const bookNumber = year - 2005;
        // Try to determine if it's Academic or General Training
        const title = (test.title || '').toLowerCase();
        let type = '';
        if (title.includes('general training') || title.includes(' gt ')) {
            type = ' GT';
        }

        return `IELTS ${bookNumber}${type} • Test ${testNum} (${year})`;
    }

    return test.title || '';
};
