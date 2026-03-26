/**
 * Reading Test Helper Functions
 *
 * Utility functions for question counting and display calculations.
 */
import { getQuestionCount } from '@/lib/utils';

/**
 * Question type display labels
 */
export const QUESTION_TYPE_LABELS = {
  matching_headings: 'Matching Headings',
  table_completion: 'Table Completion',
  matching: 'Matching Features',
  multiple_choice: 'Multiple Choice',
  true_false_not_given: 'True/False/Not Given',
  yes_no_not_given: 'Yes/No/Not Given',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  flow_chart_completion: 'Flow Chart Completion',
  diagram_completion: 'Diagram Completion',
  short_answer: 'Short Answer Questions',
};

/**
 * Convert number to Roman Numeral
 * @param {number} num - Number to convert
 * @returns {string} Roman numeral representation
 */
export const toRoman = (num) => {
  if (num <= 0 || num > 3999) return num;
  const lookup = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

/**
 * Calculate total questions from a questions map (for sidebar count)
 * @param {Object} questionsMap - Map of passage index to questions array
 * @returns {number} Total question count
 */
export const calculateTotalQuestions = (questionsMap) => {
  if (!questionsMap) return 0;
  return Object.values(questionsMap)
    .flat()
    .reduce((acc, q) => {
      return acc + getQuestionCount(q);
    }, 0);
};

/**
 * Calculate total test questions (for progress bar)
 * @param {Object} testData - Test data object with sections
 * @returns {number} Total question count
 */
export const calculateTotalTestQuestions = (testData) => {
  if (!testData) return 40;

  if (testData.total_questions) return testData.total_questions;

  const sections = testData.sections || testData.passages || [];
  if (sections.length === 0) return 40;

  return sections.reduce((acc, section) => {
    if (section.questions) {
      const qArray = Array.isArray(section.questions)
        ? section.questions
        : Object.values(section.questions).flat();
      return (
        acc +
        qArray.reduce((qAcc, q) => {
          return qAcc + getQuestionCount(q);
        }, 0)
      );
    }
    return acc + 13; // Fallback average per section
  }, 0);
};

/**
 * Calculate global question number for any question/blank
 * @param {Array} allQuestions - All questions array
 * @param {string|number} targetQuestionId - Target question ID
 * @param {string|number} blankNum - Optional blank number
 * @returns {number} Global question number
 */
export const calculateGlobalQuestionNumber = (allQuestions, targetQuestionId, blankNum = null) => {
  let globalQuestionNumber = 1;

  for (const q of allQuestions) {
    if (q.id === targetQuestionId) {
      // Found the question, now find the blank offset if applicable
      if (blankNum) {
        // Logic depends on question type
        if (
          q.type === 'table_completion' &&
          (q.table_data?.blanks || q.table_data?.blank_positions)
        ) {
          const blanks = q.table_data.blanks || q.table_data.blank_positions || [];
          const blankIndex = blanks.findIndex(
            (b) =>
              (b.id && String(b.id) === String(blankNum)) ||
              (b.id && String(b.id).endsWith(`_${blankNum}`)) ||
              (b.blankNumber && String(b.blankNumber) === String(blankNum)) ||
              (b.blank_num && String(b.blank_num) === String(blankNum)) ||
              `${b.row}_${b.col}` === String(blankNum)
          );
          if (blankIndex !== -1) return globalQuestionNumber + blankIndex;
        } else if ((q.type === 'notes_completion' || q.type === 'note_completion') && q.gap_fill) {
          const blankIndex = parseInt(blankNum) - 1;
          if (!isNaN(blankIndex)) return globalQuestionNumber + blankIndex;
        } else if (['sentence_completion', 'summary_completion', 'short_answer'].includes(q.type)) {
          const blankIndex = parseInt(blankNum) - 1;
          if (!isNaN(blankIndex)) return globalQuestionNumber + blankIndex;
        }
      }
      return globalQuestionNumber;
    }
    globalQuestionNumber += getQuestionCount(q);
  }
  return globalQuestionNumber;
};

/**
 * Group questions by their instruction text
 * @param {Array} questionsToGroup - Array of questions to group
 * @returns {Object} Map of instruction -> questions array
 */
export const groupQuestions = (questionsToGroup) => {
  if (!questionsToGroup || questionsToGroup.length === 0) return {};
  return questionsToGroup.reduce((acc, q) => {
    // Use group_instructions if available, otherwise use a default instruction based on question type
    let key = q.group_instructions;
    if (!key || key.trim() === '') {
      // Provide default instructions for common question types
      switch (q.type) {
        case 'multiple_choice':
          key = 'Choose the correct answer for each question.';
          break;
        case 'true_false_not_given':
          key =
            'Do the following statements agree with the information given in the reading passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.';
          break;
        case 'yes_no_not_given':
          key =
            'Do the following statements agree with the views of the writer in the reading passage? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.';
          break;
        case 'matching_headings':
          key = 'Choose the correct heading for each section from the list of headings below.';
          break;
        case 'sentence_completion':
          key =
            'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.';
          break;
        case 'table_completion':
          key =
            'Complete the table below. Choose NO MORE THAN TWO WORDS from the passage for each answer.';
          break;
        case 'matching':
          key = 'Match each item with the correct option.';
          break;
        default:
          key = `group_${q.type}`;
      }
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(q);
    return acc;
  }, {});
};
