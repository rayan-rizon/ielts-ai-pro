import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Link2,
  ArrowRight,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Trash2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { clearCache } from '@/lib/apiCache';

const GEMINI_PROMPT_TEMPLATE = `I have 3 IELTS Reading passages and their questions (usually 40 questions in total). For each question, generate a JSON explanation object.

**Output format**: A JSON object where keys are question numbers (as strings like "1", "2", etc.) and values follow this structure:

1. For Standard MCQ / True-False / Matching:
{
  "passage_highlight": "The exact sentence(s) from the passage that contain the answer",
  "synonym_map": [
    {
      "question_keyword": "keyword from question",
      "passage_keyword": "paraphrase in passage",
      "connection": "how they link"
    }
  ],
  "why_correct": "Why the correct answer is right",
  "why_wrong": {
    "A": "Why decoy A is wrong",
    "B": "Why decoy B is wrong"
  }
}

2. **Multi-select MCQ (e.g. "Choose TWO letters A-E")**:
If a question spans multiple numbers (e.g. Q12-13), generate SEPARATE entries for "12" and "13". 
Each entry should explain its specific correct letter in "why_correct" and explain why the remaining DECOY letters (the ones not in the correct set) are wrong in "why_wrong".

3. For Fill-in-the-blank / Summary / Table / Notes completion:
{
  "blanks": {
    "27": {
      "passage_highlight": "sentence from passage",
      "synonym_map": [...],
      "why_correct": "why this word fits"
    },
    "28": { ... }
  }
}

Rules:
- Process all 40 questions across all 3 passages at once.
- "passage_highlight" must be the EXACT text from the passages.
- "why_wrong" should explain why decoy options are incorrect based on the passage.
- Output ONLY valid JSON.

Here are the 3 passages:
Passage 1: [PASTE PASSAGE 1]
Passage 2: [PASTE PASSAGE 2]
Passage 3: [PASTE PASSAGE 3]

Here are the questions with correct answers (Q1-40):
[PASTE YOUR QUESTIONS AND ANSWERS HERE]`;

/**
 * ExplanationImportModal — Admin panel modal for bulk-importing
 * paraphrase detective explanation data for all questions of a test.
 */
const ExplanationImportModal = ({
  isOpen,
  onClose,
  questions = [],
  passageId,
  startNum = 1,
  onExplanationsUpdated,
}) => {
  const [step, setStep] = useState(1); // 1=input, 2=preview, 3=importing
  const [rawJson, setRawJson] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [dbQuestions, setDbQuestions] = useState(null); // Real questions from DB
  const [loadingDb, setLoadingDb] = useState(false);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'manage'
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Helper to check if a question has real explanation data (handles empty objects)
  const hasExplanation = useCallback((q) => {
    if (!q?.explanation_data) return false;
    if (typeof q.explanation_data === 'object') {
      const keys = Object.keys(q.explanation_data);
      if (keys.length === 0) return false;
      // Special check for { blanks: {} } which can be left behind
      if (
        keys.length === 1 &&
        keys[0] === 'blanks' &&
        Object.keys(q.explanation_data.blanks).length === 0
      ) {
        return false;
      }
    }
    return true;
  }, []);

  const handleDeleteAllExplanations = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!dbQuestions || !passageId) return;

    const sourceQuestions = dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions;
    const currentExplanations = sourceQuestions.filter(hasExplanation);
    if (currentExplanations.length === 0) return;

    const count = currentExplanations.length;
    if (
      !window.confirm(
        `Are you sure you want to remove ALL ${count} explanations for this passage? This action cannot be undone.`
      )
    )
      return;

    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({ explanation_data: null })
        .eq('passage_id', passageId);

      if (error) throw error;

      toast.success(`Removed all ${count} explanations`);
      clearCache('questions');

      setDbQuestions((prev) => (prev ? prev.map((q) => ({ ...q, explanation_data: null })) : null));
    } catch (err) {
      console.error('Failed to remove all explanations:', err);
      toast.error('Failed to remove all', { description: err.message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteExplanation = async (e, questionId, qNum) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!confirm(`Are you sure you want to delete the explanation for Question ${qNum}?`)) return;

    setDeletingId(questionId);
    try {
      const { error } = await supabase
        .from('questions')
        .update({ explanation_data: null })
        .eq('id', questionId);

      if (error) throw error;

      toast.success(`Explanation for Question ${qNum} deleted`);
      clearCache('questions');

      setDbQuestions((prev) =>
        prev ? prev.map((q) => (q.id === questionId ? { ...q, explanation_data: null } : q)) : null
      );
    } catch (err) {
      console.error('Failed to delete explanation:', err);
      toast.error('Failed to delete', { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Fetch real questions from database when modal opens
  React.useEffect(() => {
    if (!isOpen || !passageId) return;
    let cancelled = false;
    const fetchQuestions = async () => {
      setLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('passage_id', passageId)
          .order('question_number', { ascending: true });
        if (!cancelled && !error && data) {
          setDbQuestions(data);
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        if (!cancelled) setLoadingDb(false);
      }
    };
    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, passageId]);

  // Helper: count sub-questions for a question (mirrors getQuestionCount in the editor)
  const getQuestionCount = (q) => {
    if (
      q.type === 'notes_completion' ||
      q.type === 'note_completion' ||
      q.type === 'summary_completion' ||
      q.type === 'sentence_completion' ||
      q.type === 'flowchart_completion' ||
      q.type === 'diagram_completion'
    ) {
      return (
        q.gap_fill?.gap_count || (q.gap_fill?.structured_text?.match(/\[\d+\]/g) || []).length || 1
      );
    }
    if (q.type === 'table_completion') {
      if (q.table_data?.blank_positions) return q.table_data.blank_positions.length;
      if (q.table_data?.blanks) return q.table_data.blanks.length;
      if (typeof q.table_data?.blanks_count === 'number') return q.table_data.blanks_count;
      return 0;
    }
    if (q.type === 'matching_features') {
      if (!q.matching_features) return 0;
      if (q.matching_features.mode === 'paragraph') {
        return (q.matching_features.text || '').match(/\[\d+\]/g)?.length || 0;
      }
      return q.matching_features?.questions?.length || 0;
    }
    if (q.type === 'matching_headings') {
      if (q.matching_data?.paragraphs) return q.matching_data.paragraphs.length;
      if (q.questions) return q.questions.length;
      if (q.options) return q.options.length;
      return 1;
    }
    if (q.type === 'map_labeling') return q.map_labeling?.questions?.length || 0;
    if (q.type === 'multiple_choice' && q.allow_multiple) return parseInt(q.question_count || 1);
    return 1;
  };

  // Helper: parse a question_number value (could be "8", "8-13", 8, etc.) to its start integer
  const parseQuestionNum = useCallback((qNum) => {
    if (!qNum && qNum !== 0) return null;
    const str = String(qNum).trim();
    // Handle range strings like "8-13" or "8 - 13"
    const rangeMatch = str.match(/^(\d+)\s*[-–—]\s*\d+$/);
    if (rangeMatch) return parseInt(rangeMatch[1], 10);
    const parsed = parseInt(str, 10);
    return isNaN(parsed) ? null : parsed;
  }, []);

  // Build question map: maps every question number (string) to { question, isBlankParent }
  // Uses DB questions if available, otherwise falls back to editor questions
  const { questionMap, totalQuestionCount } = useMemo(() => {
    const source = dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions;
    const map = {};

    // Sort by question_number — must parse range strings first, e.g. "8-13" -> 8
    const parseNum = (q) => {
      if (!q) return 0;
      const raw = q.question_number || q.question_start;
      if (!raw && raw !== 0) return 0;
      const str = String(raw).trim();
      const rangeMatch = str.match(/^(\d+)/);
      return rangeMatch ? parseInt(rangeMatch[1], 10) : 0;
    };

    const sorted = [...source].sort((a, b) => parseNum(a) - parseNum(b));

    let counter = sorted.length > 0 ? parseNum(sorted[0]) || startNum - 1 : startNum - 1;

    sorted.forEach((q) => {
      // Parse question_number to integer — critical for range strings!
      const rawNum = q.question_number || q.question_start;
      const baseNum =
        rawNum !== null && rawNum !== undefined
          ? (parseQuestionNum(rawNum) ?? counter + 1)
          : counter + 1;

      const count = getQuestionCount(q);
      const isMultiBlank = count > 1;

      if (isMultiBlank) {
        // Map each sub-question number to the parent question
        for (let i = 0; i < count; i++) {
          const subNum = baseNum + i; // Always integer arithmetic now
          map[String(subNum)] = { question: q, isBlankParent: true, subIndex: i };
        }
      } else {
        map[String(baseNum)] = { question: q, isBlankParent: false, subIndex: 0 };
      }
      counter = baseNum + count - 1;
    });

    const totalMapped = Object.keys(map).length;
    return { questionMap: map, totalQuestionCount: totalMapped };
  }, [dbQuestions, questions, startNum, parseQuestionNum]);

  const handleParse = useCallback(() => {
    setParseError(null);
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonStr = rawJson.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Auto-wrap if missing outer braces (common when pasting from AI chat)
      // Detect: starts with a quoted key like `"1":` instead of `{`
      if (!jsonStr.startsWith('{') && /^\s*"/.test(jsonStr)) {
        jsonStr = '{' + jsonStr;
      }
      if (!jsonStr.endsWith('}')) {
        jsonStr = jsonStr + '}';
      }

      // Remove trailing commas before closing braces (common in AI output)
      jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      const parsed = JSON.parse(jsonStr);

      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(
          'Expected a JSON object with question numbers as keys (e.g. {"1": {...}, "2": {...}})'
        );
      }

      // Validate structure
      const entries = Object.entries(parsed);
      if (entries.length === 0) {
        throw new Error('No explanation entries found in the JSON');
      }

      // Validate each entry
      let validCount = 0;
      let warningCount = 0;
      const warnings = [];

      entries.forEach(([key, value]) => {
        if (!questionMap[key]) {
          warnings.push(`Question #${key} not found in this test`);
          warningCount++;
        }
        // Check if it's a blank-based or regular entry
        if (value.blanks) {
          Object.entries(value.blanks).forEach(([blankKey, blankData]) => {
            if (!blankData.passage_highlight && !blankData.synonym_map && !blankData.why_correct) {
              warnings.push(`Question #${key}, blank ${blankKey}: No useful data found`);
            }
          });
        } else {
          if (!value.passage_highlight && !value.synonym_map && !value.why_correct) {
            warnings.push(
              `Question #${key}: No useful data found (missing passage_highlight, synonym_map, and why_correct)`
            );
          }
        }
        validCount++;
      });

      setParsedData({
        entries: parsed,
        validCount,
        warningCount,
        warnings,
        matchedCount: entries.filter(([key]) => questionMap[key]).length,
      });
      setStep(2);
    } catch (err) {
      setParseError(err.message);
    }
  }, [rawJson, questionMap]);

  const handleImport = useCallback(async () => {
    if (!parsedData) return;
    setImporting(true);
    setStep(3);

    try {
      const entries = Object.entries(parsedData.entries);
      let successCount = 0;
      let failCount = 0;
      let skipCount = 0; // JSON keys that had no matching question in this passage
      const errors = [];
      const warnings = [];

      // Group entries by their parent DB question ID
      // For multi-blank questions, multiple JSON keys (8,9,10...) map to the same parent question
      const questionUpdates = new Map(); // dbQuestionId -> { question, data }

      for (const [qNum, rawData] of entries) {
        const mapped = questionMap[qNum];
        if (!mapped) {
          // Not all JSON keys need to match — user may have imported all 40 Qs for a 13Q passage
          skipCount++;
          continue;
        }

        // ── Data Normalization ─────────────────────────────────────────
        // Case 1: AI wrapped single blank data: { "8": { "blanks": { "8": {...} } } }
        //   → unwrap to get: { passage_highlight, synonym_map, why_correct }
        // Case 2: AI wrapped multi-blank data: { "14": { "blanks": { "14":{}, "15":{} } } }
        //   → keep .blanks as-is for merging below
        let explanationData = { ...rawData };
        if (
          explanationData.blanks &&
          typeof explanationData.blanks === 'object' &&
          !Array.isArray(explanationData.blanks)
        ) {
          const blankKeys = Object.keys(explanationData.blanks);
          // If the only blank key matches THIS question number, unwrap it (single-blank wrapping)
          if (blankKeys.length === 1 && blankKeys[0] === qNum) {
            explanationData = { ...explanationData.blanks[qNum] };
          }
          // Otherwise keep the blanks wrapper — it will be merged below
        }

        const { question, isBlankParent } = mapped;
        const dbId = question.id;

        // Warn about unsaved (temp) IDs — can't persist to DB
        if (dbId && String(dbId).startsWith('temp')) {
          if (!questionUpdates.has(dbId)) {
            warnings.push(`Q${qNum}: Question not saved to DB yet — save the test first`);
          }
        }

        if (isBlankParent) {
          // Merge blanks into the parent question's accumulated explanation_data
          if (!questionUpdates.has(dbId)) {
            const existingData = question.explanation_data;
            questionUpdates.set(dbId, {
              question,
              data:
                existingData && existingData.blanks
                  ? JSON.parse(JSON.stringify(existingData)) // deep clone
                  : { blanks: {} },
            });
          }
          const existing = questionUpdates.get(dbId);
          if (!existing.data.blanks) existing.data.blanks = {};

          if (explanationData.blanks && typeof explanationData.blanks === 'object') {
            // AI gave us wrapped blanks — merge them all in
            Object.entries(explanationData.blanks).forEach(([blankKey, blankData]) => {
              existing.data.blanks[blankKey] = blankData;
            });
          } else {
            // Flat data — store it keyed by this question number
            const { type: _type, ...rest } = explanationData;
            existing.data.blanks[qNum] = rest;
          }
        } else {
          // Standard question — each gets its own explanation_data object
          const { type: _type, ...rest } = explanationData;
          questionUpdates.set(dbId, { question, data: rest });
        }
      }

      // Perform database updates and track real outcomes
      const successfulUpdates = [];
      for (const [dbId, { question, data }] of questionUpdates) {
        // Skip temp IDs — can't update non-existent DB rows
        if (dbId && String(dbId).startsWith('temp')) {
          failCount++;
          errors.push(
            `Q${question.question_number}: Not saved to database (temp ID). Save the test first.`
          );
          continue;
        }

        try {
          const { error, data: updateResult } = await supabase
            .from('questions')
            .update({ explanation_data: data })
            .eq('id', dbId)
            .select('id, question_number, explanation_data');

          if (error) {
            console.error(`[ExplanationImport] DB error Q${question.question_number}:`, error);
            failCount++;
            errors.push(`Q${question.question_number}: ${error.message}`);
          } else if (!updateResult || updateResult.length === 0) {
            // 0 rows updated — ID doesn't exist in DB or RLS blocked it
            console.error(
              `[ExplanationImport] 0 rows updated for Q${question.question_number} (id: ${dbId})`
            );
            failCount++;
            errors.push(
              `Q${question.question_number}: Question not found in database (ID mismatch). Try re-saving the test.`
            );
          } else {
            // Verify the data was actually written
            const saved = updateResult[0]?.explanation_data;
            if (!saved || Object.keys(saved).length === 0) {
              console.warn(
                `[ExplanationImport] Q${question.question_number}: Saved but explanation_data is empty — possible issue`
              );
              warnings.push(`Q${question.question_number}: Saved but returned empty data`);
            }
            successCount++;
            question.explanation_data = data;
            successfulUpdates.push({ id: question.id, data });
          }
        } catch (err) {
          console.error(`[ExplanationImport] Exception Q${question.question_number}:`, err);
          failCount++;
          errors.push(`Q${question.question_number}: ${err.message}`);
        }
      }

      setImportResults({ successCount, failCount, skipCount, errors, warnings });

      if (successCount > 0) {
        // Invalidate questions cache so test pages fetch fresh explanation data
        clearCache('questions');

        // Sync parent local state to prevent autosave overwrites
        if (onExplanationsUpdated && successfulUpdates.length > 0) {
          onExplanationsUpdated(successfulUpdates);
        }

        // Refresh DB questions state to reflect the newly saved data
        if (passageId) {
          supabase
            .from('questions')
            .select('*')
            .eq('passage_id', passageId)
            .order('question_number', { ascending: true })
            .then(({ data: refreshed }) => {
              if (refreshed) setDbQuestions(refreshed);
            });
        }

        const failDesc = failCount > 0 ? ` (${failCount} failed — check details below)` : '';
        toast.success(
          `✓ Saved explanations for ${successCount} question${successCount > 1 ? 's' : ''}${failDesc}`,
          { duration: failCount > 0 ? 6000 : 4000 }
        );
      } else if (failCount > 0) {
        toast.error(`Import failed for all ${failCount} question${failCount > 1 ? 's' : ''}`, {
          description: errors[0] || 'Unknown error',
          duration: 6000,
        });
      } else if (skipCount === entries.length) {
        toast.warning('No questions matched', {
          description:
            'None of the JSON keys matched questions in this passage. Make sure you are importing for the correct passage.',
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('[ExplanationImport] Fatal error:', err);
      toast.error('Import failed', { description: err.message });
      setImportResults({
        successCount: 0,
        failCount: 1,
        skipCount: 0,
        errors: [err.message],
        warnings: [],
      });
    } finally {
      setImporting(false);
    }
  }, [parsedData, questionMap, passageId, onExplanationsUpdated]);

  const handleClose = () => {
    setStep(1);
    setRawJson('');
    setParsedData(null);
    setParseError(null);
    setImportResults(null);
    setShowGuide(false);
    setActiveTab('import');
    onClose();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(GEMINI_PROMPT_TEMPLATE);
    toast.success('Prompt copied to clipboard!');
  };

  const renderPreviewEntry = (qNum, data) => {
    const mapped = questionMap[qNum];
    const question = mapped?.question;
    const isExpanded = expandedQuestion === qNum;
    const isBlanks = !!data.blanks;

    return (
      <motion.div
        key={qNum}
        layout
        className={cn(
          'rounded-lg border transition-all duration-200',
          question
            ? 'border-stone-200/60 dark:border-stone-700/50 bg-white/80 dark:bg-stone-900/50'
            : 'border-[rgb(var(--signal-warn)/0.3)] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)]'
        )}
      >
        <button
          onClick={() => setExpandedQuestion(isExpanded ? null : qNum)}
          className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-stone-50/50 dark:hover:bg-stone-800/30 rounded-lg transition-colors"
        >
          <Badge
            variant={question ? 'default' : 'secondary'}
            className={cn(
              'text-xs font-bold min-w-[32px] justify-center',
              question
                ? 'bg-stone-100 text-stone-700 dark:bg-stone-900/40 dark:text-stone-300'
                : 'bg-[rgb(var(--signal-warn)/0.06)] text-[rgb(var(--signal-warn))] bg-[rgb(var(--signal-warn)/0.06)] text-[rgb(var(--signal-warn))]'
            )}
          >
            Q{qNum}
          </Badge>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {question?.question_text?.substring(0, 60) || 'No matching question'}
              {question?.question_text?.length > 60 ? '...' : ''}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {data.synonym_map?.length > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                <Link2 className="w-2.5 h-2.5 mr-0.5" />
                {data.synonym_map.length}
              </Badge>
            )}
            {isBlanks && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {Object.keys(data.blanks).length} blanks
              </Badge>
            )}
            {!question && <AlertTriangle className="w-3.5 h-3.5 text-[rgb(var(--signal-warn))]" />}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-2">
                {isBlanks ? (
                  // Render blanks
                  Object.entries(data.blanks).map(([blankKey, blankData]) => (
                    <div
                      key={blankKey}
                      className="p-2 rounded-md bg-stone-50 dark:bg-stone-800/40 space-y-1.5"
                    >
                      <Badge variant="outline" className="text-[9px]">
                        Blank #{blankKey}
                      </Badge>
                      {blankData.passage_highlight && (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 italic border-l-2 border-[rgb(var(--signal-ok)/0.3)] pl-2">
                          "{blankData.passage_highlight}"
                        </p>
                      )}
                      {blankData.synonym_map?.map((sm, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px]">
                          <span className="text-stone-600 dark:text-stone-400 font-medium">
                            "{sm.question_keyword}"
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))] font-medium">
                            "{sm.passage_keyword}"
                          </span>
                        </div>
                      ))}
                      {blankData.why_correct && (
                        <p className="text-[10px] text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))]">
                          {blankData.why_correct}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    {data.passage_highlight && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[rgb(var(--signal-ok))] font-bold">
                          Passage
                        </span>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 italic border-l-2 border-[rgb(var(--signal-ok)/0.3)] pl-2 mt-0.5">
                          "{data.passage_highlight}"
                        </p>
                      </div>
                    )}
                    {data.synonym_map?.map((sm, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-stone-600 dark:text-stone-400 font-medium">
                          "{sm.question_keyword}"
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                        <span className="text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))] font-medium">
                          "{sm.passage_keyword}"
                        </span>
                        <span className="text-muted-foreground/60 hidden sm:inline">
                          — {sm.connection}
                        </span>
                      </div>
                    ))}
                    {data.why_correct && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[rgb(var(--signal-ok))] font-bold">
                          Why Correct
                        </span>
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 mt-0.5">
                          {data.why_correct}
                        </p>
                      </div>
                    )}
                    {data.why_wrong && Object.keys(data.why_wrong).length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[rgb(var(--signal-fault))] font-bold">
                          Why Wrong
                        </span>
                        {Object.entries(data.why_wrong).map(([key, val]) => (
                          <p
                            key={key}
                            className="text-[10px] text-stone-600 dark:text-stone-400 mt-0.5"
                          >
                            <span className="font-bold text-[rgb(var(--signal-fault))]">
                              {key}:
                            </span>{' '}
                            {val}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-stone-500 to-stone-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                Paraphrase Detective
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage and import explanations for questions in this test
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('import')}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'import'
                  ? 'border-stone-500 text-stone-700 dark:border-stone-400 dark:text-stone-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'
              )}
            >
              Import New
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'manage'
                  ? 'border-stone-500 text-stone-700 dark:border-stone-400 dark:text-stone-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'
              )}
            >
              Manage Existing
              {dbQuestions?.filter(hasExplanation)?.length > 0 && (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 h-5 text-[10px] bg-stone-100 dark:bg-stone-800 pointer-events-none"
                >
                  {dbQuestions.filter(hasExplanation).length}
                </Badge>
              )}
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'manage' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Existing Explanations</h3>
                  <p className="text-xs text-muted-foreground">
                    Preview or remove explanations currently saved in the database.
                  </p>
                </div>
                {(dbQuestions && dbQuestions.length > 0 ? dbQuestions : questions)?.some(
                  hasExplanation
                ) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAllExplanations}
                    disabled={isDeletingAll}
                    className="text-xs text-[rgb(var(--signal-fault))] hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.06)] dark:hover:bg-[rgb(var(--signal-fault)/0.06)] gap-1.5 h-8"
                  >
                    {isDeletingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Remove All
                  </Button>
                )}
              </div>

              {loadingDb ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !dbQuestions || dbQuestions.filter(hasExplanation).length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg bg-stone-50/50 dark:bg-stone-900/20">
                  <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                    No explanations found.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Switch to the "Import New" tab to add some.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative min-h-[100px]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {dbQuestions
                      .filter(hasExplanation)
                      .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
                      .map((q) => (
                        <motion.div
                          key={q.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="relative group p-1 border rounded-xl overflow-hidden shadow-sm bg-stone-50/50 dark:bg-stone-900/30"
                        >
                          {renderPreviewEntry(String(q.question_number), q.explanation_data)}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="w-7 h-7 bg-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault))] hover:opacity-90 shadow-sm"
                              onClick={(e) => handleDeleteExplanation(e, q.id, q.question_number)}
                              disabled={deletingId === q.id || isDeletingAll}
                              title="Delete Explanation"
                            >
                              {deletingId === q.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Warning: Test not saved */}
              {!passageId && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)] border border-[rgb(var(--signal-warn)/0.3)] border-[rgb(var(--signal-warn)/0.3)]">
                  <AlertTriangle className="w-4 h-4 text-[rgb(var(--signal-warn))] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))]">
                      Save the test first
                    </p>
                    <p className="text-xs text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))] mt-0.5">
                      You need to save this test before importing explanations. The questions must
                      exist in the database.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading DB questions */}
              {loadingDb && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 text-stone-500 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Loading questions from database...
                  </span>
                </div>
              )}

              {/* Step 1: Input */}
              {step === 1 && !loadingDb && (
                <div className="space-y-4">
                  {/* Gemini AI Guide Toggle */}
                  <div className="rounded-xl border border-stone-200/60 dark:border-stone-800/40 overflow-hidden">
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="w-full px-4 py-3 flex items-center gap-3 bg-stone-50/50 dark:bg-stone-950/20 hover:bg-stone-100/50 dark:hover:bg-stone-900/30 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-linear-to-br from-stone-500 to-stone-500 flex items-center justify-center shadow-sm shrink-0">
                        <Info className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          How to use Gemini AI to generate explanations
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Click to expand the guide with copy-ready prompt template
                        </p>
                      </div>
                      {showGuide ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showGuide && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-stone-100 dark:border-stone-900/30 space-y-3">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                Steps:
                              </h4>
                              <ol className="text-[11px] text-stone-600 dark:text-stone-400 space-y-1.5 list-decimal pl-4">
                                <li>Copy the prompt template below</li>
                                <li>
                                  Open{' '}
                                  <a
                                    href="https://gemini.google.com"
                                    target="_blank"
                                    rel="noopener"
                                    className="text-stone-500 underline"
                                  >
                                    Gemini AI
                                  </a>{' '}
                                  or{' '}
                                  <a
                                    href="https://aistudio.google.com"
                                    target="_blank"
                                    rel="noopener"
                                    className="text-stone-500 underline"
                                  >
                                    AI Studio
                                  </a>
                                </li>
                                <li>
                                  Paste the prompt and replace{' '}
                                  <code className="bg-stone-100 dark:bg-stone-800 px-1 rounded text-[10px]">
                                    [PASTE PASSAGE 1-3]
                                  </code>{' '}
                                  with the full text of all 3 passages
                                </li>
                                <li>
                                  Replace{' '}
                                  <code className="bg-stone-100 dark:bg-stone-800 px-1 rounded text-[10px]">
                                    [PASTE YOUR QUESTIONS AND ANSWERS HERE]
                                  </code>{' '}
                                  with all 40 questions + correct answers
                                </li>
                                <li>Send the prompt and copy the JSON output</li>
                                <li>Paste it in the text area below and click "Parse & Preview"</li>
                              </ol>
                            </div>

                            <div className="relative">
                              <pre className="text-[10px] bg-stone-900 dark:bg-stone-950 text-stone-300 p-3 rounded-lg overflow-x-auto max-h-48 scrollbar-thin">
                                {GEMINI_PROMPT_TEMPLATE}
                              </pre>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleCopyPrompt}
                                className="absolute top-2 right-2 h-7 text-[10px] gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy Prompt
                              </Button>
                            </div>

                            <div className="rounded-lg border border-[rgb(var(--signal-warn)/0.3)] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)] p-3">
                              <p className="text-[10px] text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))]">
                                <strong>💡 Tip:</strong> For best results, use Gemini 2.0 Flash or
                                Pro. Include the question numbers and correct answers so Gemini can
                                generate accurate "why_wrong" explanations. You can also edit the
                                JSON manually before importing.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* JSON Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                        Paste Explanation JSON
                      </label>
                      <Badge variant="outline" className="text-[9px]">
                        {loadingDb ? '...' : totalQuestionCount} questions in test
                      </Badge>
                    </div>
                    <textarea
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder='{\n  "1": {\n    "passage_highlight": "...",\n    "synonym_map": [...],\n    "why_correct": "...",\n    "why_wrong": {"A": "...", "C": "..."}\n  },\n  "2": { ... }\n}'
                      className="w-full h-64 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:ring-2 focus: focus:border-stone-400 transition-all placeholder:text-muted-foreground/40"
                      spellCheck={false}
                    />
                    {parseError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgb(var(--signal-fault)/0.06)] bg-[rgb(var(--signal-fault)/0.06)] border border-[rgb(var(--signal-fault)/0.3)] border-[rgb(var(--signal-fault)/0.3)]"
                      >
                        <AlertTriangle className="w-4 h-4 text-[rgb(var(--signal-fault))] shrink-0 mt-0.5" />
                        <p className="text-xs text-[rgb(var(--signal-fault))] text-[rgb(var(--signal-fault))]">
                          {parseError}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              {step === 2 && parsedData && (
                <div className="space-y-3">
                  {/* Stats Bar */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-700/40">
                    <Badge className="bg-stone-100 text-stone-700 dark:bg-stone-900/40 dark:text-stone-300 text-xs">
                      {parsedData.validCount} entries
                    </Badge>
                    <Badge className="bg-[rgb(var(--signal-ok)/0.06)] text-[rgb(var(--signal-ok))] bg-[rgb(var(--signal-ok)/0.06)] text-[rgb(var(--signal-ok))] text-xs">
                      {parsedData.matchedCount} matched
                    </Badge>
                    {parsedData.warningCount > 0 && (
                      <Badge className="bg-[rgb(var(--signal-warn)/0.06)] text-[rgb(var(--signal-warn))] bg-[rgb(var(--signal-warn)/0.06)] text-[rgb(var(--signal-warn))] text-xs">
                        {parsedData.warningCount} warnings
                      </Badge>
                    )}
                  </div>

                  {/* Warnings */}
                  {parsedData.warnings.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)] border border-[rgb(var(--signal-warn)/0.3)] border-[rgb(var(--signal-warn)/0.3)]">
                      <p className="text-[10px] font-bold text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))] mb-1">
                        Warnings:
                      </p>
                      {parsedData.warnings.map((w, i) => (
                        <p
                          key={i}
                          className="text-[10px] text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))]"
                        >
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Entries Preview */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1.5 pr-3">
                      {Object.entries(parsedData.entries).map(([qNum, data]) =>
                        renderPreviewEntry(qNum, data)
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Step 3: Importing / Results */}
              {step === 3 && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  {importing ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-stone-500 to-stone-500 flex items-center justify-center shadow-xl">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Importing explanations...
                      </p>
                      <p className="text-xs text-muted-foreground">Saving to database</p>
                    </>
                  ) : importResults ? (
                    <>
                      <div
                        className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl',
                          importResults.failCount === 0
                            ? 'bg-[rgb(var(--signal-ok))]'
                            : 'bg-[rgb(var(--signal-warn))]'
                        )}
                      >
                        {importResults.failCount === 0 ? (
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {importResults.successCount > 0
                          ? `✓ ${importResults.successCount} explanation${importResults.successCount !== 1 ? 's' : ''} saved to database`
                          : 'No explanations saved'}
                      </p>
                      {importResults.skipCount > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          {importResults.skipCount} JSON keys skipped (not matching questions in
                          this test)
                        </p>
                      )}
                      {importResults.failCount > 0 && (
                        <div className="w-full max-w-sm p-2.5 rounded-lg bg-[rgb(var(--signal-fault)/0.06)] bg-[rgb(var(--signal-fault)/0.06)] border border-[rgb(var(--signal-fault)/0.3)] border-[rgb(var(--signal-fault)/0.3)] text-left">
                          <p className="text-xs text-[rgb(var(--signal-fault))] text-[rgb(var(--signal-fault))] font-semibold mb-1">
                            {importResults.failCount} failed:
                          </p>
                          {importResults.errors.map((err, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">
                              • {err}
                            </p>
                          ))}
                        </div>
                      )}
                      {importResults.warnings?.length > 0 && (
                        <div className="w-full max-w-sm p-2.5 rounded-lg bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)] border border-[rgb(var(--signal-warn)/0.3)] border-[rgb(var(--signal-warn)/0.3)] text-left">
                          <p className="text-xs text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))] font-semibold mb-1">
                            Warnings:
                          </p>
                          {importResults.warnings.map((w, i) => (
                            <p
                              key={i}
                              className="text-[10px] text-[rgb(var(--signal-warn))] text-[rgb(var(--signal-warn))]"
                            >
                              • {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border/40 shrink-0">
          {activeTab === 'manage' ? (
            <Button onClick={handleClose} variant="outline" className="w-full sm:w-auto">
              Close Manage Window
            </Button>
          ) : (
            <>
              {step === 1 && (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleParse}
                    disabled={!rawJson.trim()}
                    className="bg-linear-to-r from-stone-600 to-stone-600 text-white hover:from-stone-500 hover:to-stone-500 shadow-md"
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    Parse & Preview
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setParsedData(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!parsedData || parsedData.matchedCount === 0}
                    className="bg-linear-to-r from-stone-600 to-stone-600 text-white hover:from-stone-500 hover:to-stone-500 shadow-md"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Import {parsedData?.matchedCount || 0} Explanations
                  </Button>
                </>
              )}
              {step === 3 && !importing && (
                <Button
                  onClick={handleClose}
                  className="bg-linear-to-r from-stone-600 to-stone-600 text-white"
                >
                  Done
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExplanationImportModal;
