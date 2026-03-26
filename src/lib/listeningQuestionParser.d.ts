/**
 * Type definitions for listeningQuestionParser.js
 * Admin tool for importing IELTS listening questions from formatted text
 */

export interface ListeningQuestion {
    type: string;
    question_text: string;
    question_number?: number | string;
    correct_answer?: string | string[];
    correct_answers?: Record<string | number, string>;
    options?: string[];
    explanation?: string;
    part_number?: number;
    matching_features?: {
        mode?: string;
        questions?: Array<{
            id: string | number;
            text: string;
            answer?: string;
            correct_answer?: string;
            questionNumber?: number;
        }>;
        options?: string[];
        answers?: Record<string | number, string>;
    };
    map_labeling?: {
        options?: string[];
        items?: Array<{
            id: string | number;
            text: string;
            answer?: string;
        }>;
    };
    table_data?: {
        headers?: string[];
        rows?: string[][];
        blanks?: Array<{
            id: string | number;
            blank_num?: number;
            row: number;
            col: number;
            answer?: string;
            correct_answer?: string;
        }>;
        blank_positions?: Array<{
            id: string | number;
            blank_num?: number;
            row: number;
            col: number;
            answer?: string;
            correct_answer?: string;
        }>;
    };
    gap_fill?: {
        structured_text?: string;
        answers?: Record<number, string> | string[];
        gap_count?: number;
        box_title?: string;
        question_count?: number;
        text?: string;
    };
}

export interface ListeningParseResult {
    questions: ListeningQuestion[];
    errors: string[];
    warnings: string[];
}

export interface ListeningAnswerMap {
    [questionNumber: string | number]: string;
}

export interface ListeningValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Main parser entry point for listening questions
 * @param text - The raw markdown text
 * @param targetSection - e.g., "Part 1"
 */
export function parseListeningQuestions(
    text: string,
    targetSection?: string
): ListeningParseResult;

/**
 * Parse answer list for listening questions
 * Format: "1. answer\n2. answer"
 */
export function parseListeningAnswerList(text: string): ListeningAnswerMap;

/**
 * Merge answers into parsed questions
 */
export function mergeListeningAnswers(
    questions: ListeningQuestion[],
    answerMap: ListeningAnswerMap
): ListeningQuestion[];

/**
 * Validate listening bulk data
 */
export function validateListeningBulkData(questions: ListeningQuestion[]): ListeningValidationResult;
