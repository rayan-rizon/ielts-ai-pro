/**
 * Type definitions for bulkQuestionParser.js
 * Admin tool for importing IELTS reading questions from formatted text
 */

export interface ParsedQuestion {
  type: string;
  question_text: string;
  question_number?: number | string;
  correct_answer?: string | string[];
  correct_answers?: Record<string | number, string>;
  options?: string[];
  explanation?: string;
  matching_data?: {
    paragraphs?: Array<{ label: string; correct_heading: string }>;
    headings?: string[];
  };
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
  };
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: string[];
  warnings: string[];
}

export interface AnswerMap {
  [questionNumber: string | number]: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main parser entry point for bulk question import
 * @param text - The raw text from the textarea
 * @param targetSection - "Passage 1", "Part 2", etc. (for metadata)
 */
export function parseBulkQuestions(text: string, targetSection?: string): ParseResult;

/**
 * Parse answer list from second textarea
 * Format: "1. True\n2. False" or "1. A\n2. B,C"
 */
export function parseAnswerList(text: string): AnswerMap;

/**
 * Merge parsed answers into questions
 */
export function mergeAnswers(questions: ParsedQuestion[], answerMap: AnswerMap): ParsedQuestion[];

/**
 * Validate bulk data before import
 */
export function validateBulkData(questions: ParsedQuestion[]): ValidationResult;
