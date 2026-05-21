import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  parseBulkQuestions,
  parseAnswerList,
  mergeAnswers,
  validateBulkData,
} from '@/lib/bulkQuestionParser';
import {
  parseListeningQuestions,
  parseListeningAnswerList,
  mergeListeningAnswers,
  validateListeningBulkData,
} from '@/lib/listeningQuestionParser';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, AlertTriangle, Info, Trash2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

const QUESTION_TYPES = [
  { value: 'true_false_not_given', label: 'True/False/Not Given' },
  { value: 'yes_no_not_given', label: 'Yes/No/Not Given' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'matching_features', label: 'Matching Features' },
  { value: 'summary_completion', label: 'Summary' },
  { value: 'notes_completion', label: 'Notes Completion' },
  { value: 'table_completion', label: 'Table Completion' },
  { value: 'flowchart', label: 'Flowchart' },
];

const BulkImportModal = ({
  isOpen,
  onClose,
  onImport,
  testType = 'reading',
  initialSection = 0,
  mode = 'full',
  existingQuestions = [],
}) => {
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [targetSection, setTargetSection] = useState(initialSection.toString());
  const [validation, setValidation] = useState({ errors: [], suggestions: [] });
  const initializedRef = React.useRef(false);

  // Step 1: Parsing - Only initialize when modal first opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setStep(1);
      setRawText('');
      setAnswerText('');
      setParsedQuestions([]);
      initializedRef.current = false; // Reset for next open
      return;
    }

    // Guard: Only initialize ONCE per open
    if (initializedRef.current) return;
    initializedRef.current = true;

    setTargetSection(initialSection.toString());

    if (mode === 'answers_only') {
      // Pre-load existing questions and skip to Step 2
      setParsedQuestions([...existingQuestions]);
      setStep(2);
    } else {
      setStep(1);
    }
  }, [isOpen, initialSection, mode, existingQuestions]);

  const handleParseQuestions = () => {
    // Use the correct parser based on test type
    const parsed =
      testType === 'listening'
        ? parseListeningQuestions(rawText, `Part ${parseInt(targetSection) + 1}`)
        : parseBulkQuestions(rawText, `Section ${parseInt(targetSection) + 1}`);
    // Assign temp IDs for react keys
    const withIds = parsed.map((q, idx) => ({ ...q, id: `temp_${Date.now()}_${idx}` }));
    setParsedQuestions(withIds);
    setStep(2);
  };

  const handleParseAnswers = () => {
    // Use the correct functions based on test type
    const answerMap =
      testType === 'listening' ? parseListeningAnswerList(answerText) : parseAnswerList(answerText);
    const merged =
      testType === 'listening'
        ? mergeListeningAnswers(parsedQuestions, answerMap)
        : mergeAnswers(parsedQuestions, answerMap);
    setParsedQuestions(merged);

    // Run validation
    const val =
      testType === 'listening' ? validateListeningBulkData(merged) : validateBulkData(merged);
    setValidation(val);

    setStep(3);
  };

  const handleBack = () => {
    if (mode === 'answers_only' && step === 2) {
      onClose(); // Exit if backing out of first visible step
    } else {
      setStep(step - 1);
    }
  };

  // Manual Editing in Step 3
  const updateQuestion = (id, field, value) => {
    const updated = parsedQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q));
    setParsedQuestions(updated);
    // Re-validate
    setValidation(validateBulkData(updated));
  };

  const deleteQuestion = (id) => {
    const updated = parsedQuestions.filter((q) => q.id !== id);
    setParsedQuestions(updated);
    setValidation(validateBulkData(updated));
  };

  const handleFinalImport = () => {
    onImport(parsedQuestions, parseInt(targetSection));
    onClose();
  };

  // Render Logic
  const sectionLabel = testType === 'reading' ? 'Passage' : 'Part';
  const sectionCount = testType === 'reading' ? 3 : 4;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-oid="txafz4z">
      <DialogContent
        className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden"
        data-oid="0.e.7tz"
      >
        <DialogHeader
          className="p-6 pb-2 border-b bg-slate-50 dark:bg-slate-900/50"
          data-oid="7s90kts"
        >
          <div className="flex justify-between items-center" data-oid="56j2_si">
            <DialogTitle className="text-xl" data-oid="bs1nrb1">
              Bulk Import Questions
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-xs font-normal relative top-[-4px]"
              data-oid="jlhr4px"
            >
              {mode === 'answers_only' ? 'Import Answers' : `Step ${step} of 3`}
            </Badge>
          </div>
          <DialogDescription data-oid="52o-yu6">
            Paste your questions and answers to automatically import them.
          </DialogDescription>

          {/* Progress Stepper */}
          {mode !== 'answers_only' && (
            <div className="flex gap-2 mt-4" data-oid="9erolf3">
              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  step >= 1 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
                )}
                data-oid="dt4ax59"
              />

              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  step >= 2 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
                )}
                data-oid="ekaix1n"
              />

              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  step >= 3 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
                )}
                data-oid="0xxmbo5"
              />
            </div>
          )}
        </DialogHeader>

        <div
          className="flex-1 overflow-hidden p-6 bg-slate-50/30 dark:bg-background"
          data-oid="61fqhx5"
        >
          {step === 1 && (
            <div className="h-full flex flex-col gap-4" data-oid="grtsgrc">
              <div className="flex gap-4 items-start" data-oid="vbl-w8f">
                <div className="flex-1" data-oid="ivhv83e">
                  <label className="text-sm font-medium mb-2 block" data-oid="dauxy5w">
                    1. Target {sectionLabel}
                  </label>
                  <Select value={targetSection} onValueChange={setTargetSection} data-oid="1jj2wn6">
                    <SelectTrigger className="w-full" data-oid="_euc806">
                      <SelectValue data-oid=".23c2t." />
                    </SelectTrigger>
                    <SelectContent data-oid="6w-z8ya">
                      {Array.from({ length: sectionCount }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()} data-oid=".x69ee8">
                          {sectionLabel} {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[3]" data-oid=":h84rxi">
                  <label
                    className="text-sm font-medium mb-2 block flex justify-between"
                    data-oid="n7wrc7i"
                  >
                    <span data-oid="k0mrptb">2. Paste Question Text</span>
                    <span className="text-muted-foreground font-normal text-xs" data-oid="67:6gpg">
                      Supports: "Questions 1-5..." blocks
                    </span>
                  </label>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Questions 1-5\n\nDo the following statements agree with the information given in Reading Passage 1?\n\nTRUE   if the statement agrees with the information\nFALSE  if the statement contradicts the information\nNOT GIVEN if there is no information on this\n\n1. The polar bear is found in the Antarctic.\n2. ...`}
                    className="h-[400px] font-mono text-sm resize-none focus-visible:ring-violet-500"
                    data-oid="6w.rnbd"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="h-full flex flex-col gap-4" data-oid="6w:roim">
              <Alert
                className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900"
                data-oid="9iycuh-"
              >
                <Info className="h-4 w-4" data-oid="3v_.fxg" />
                <AlertTitle data-oid="7e4wg5_">Optional: Paste Answers</AlertTitle>
                <AlertDescription data-oid="1n5hc9n">
                  Paste a numbered list of answers to automatically populate the `Correct Answer`
                  field. We'll match them by question number.
                </AlertDescription>
              </Alert>
              <label className="text-sm font-medium block" data-oid="taodpal">
                Paste Answer List
              </label>
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={`1. False\n2. True\n3. Not Given\n...\n25. B, D`}
                className="flex-1 font-mono text-sm resize-none focus-visible:ring-violet-500"
                data-oid="j1q8xul"
              />
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col gap-4" data-oid=".enpkox">
              {/* Validation Summary */}
              {(validation.errors.length > 0 || validation.suggestions.length > 0) && (
                <div className="flex gap-2" data-oid="90ruz3c">
                  {validation.errors.length > 0 && (
                    <Badge variant="destructive" className="flex gap-1" data-oid="6wh-987">
                      <AlertTriangle className="w-3 h-3" data-oid="jrdyu8c" />{' '}
                      {validation.errors.length} Errors
                    </Badge>
                  )}
                  {validation.suggestions.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex gap-1 border-amber-200"
                      data-oid="-vuuryo"
                    >
                      <Info className="w-3 h-3" data-oid="v-p9zrn" />{' '}
                      {validation.suggestions.length} Suggestions
                    </Badge>
                  )}
                </div>
              )}

              <ScrollArea
                className="flex-1 border rounded-lg bg-white dark:bg-slate-900"
                data-oid="ku6-hts"
              >
                <div className="divide-y" data-oid="oaqpbwu">
                  {parsedQuestions.map((q, _idx) => {
                    const error = validation.errors.find((e) => e.id === q.id);
                    const warning = validation.suggestions.find((s) =>
                      s.ids ? s.ids.includes(q.id) : s.id === q.id
                    );

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                          error && 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10'
                        )}
                        data-oid="f80t0n3"
                      >
                        {/* Status Indicator */}
                        <div
                          className="w-8 shrink-0 flex flex-col items-center gap-2 pt-2"
                          data-oid="e4gkkwx"
                        >
                          <Badge
                            variant="outline"
                            className="w-6 h-6 rounded-full flex items-center justify-center p-0 border-slate-300 text-slate-500"
                            data-oid="otepwno"
                          >
                            {q.question_number}
                          </Badge>
                          {error && (
                            <TooltipProvider data-oid="obxg6np">
                              <Tooltip data-oid="3-7k4q2">
                                <TooltipTrigger data-oid="1zxa9yq">
                                  <AlertTriangle
                                    className="w-4 h-4 text-red-500"
                                    data-oid="115v.2d"
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  className="bg-red-500 text-white border-0"
                                  data-oid="bfw8l6c"
                                >
                                  <p data-oid="s-qawit">{error.msg}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {warning && !error && (
                            <TooltipProvider data-oid="85hzylv">
                              <Tooltip data-oid="yytgjr-">
                                <TooltipTrigger data-oid="qx17nt1">
                                  <Info className="w-4 h-4 text-amber-500" data-oid="eu2uii_" />
                                </TooltipTrigger>
                                <TooltipContent
                                  className="bg-amber-500 text-white border-0"
                                  data-oid="3u_s8e-"
                                >
                                  <p data-oid="7at8d0b">{warning.msg}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        {/* Content inputs */}
                        <div className="flex-1 space-y-3" data-oid="xtsx_8a">
                          <div className="flex gap-2" data-oid="t.nvd9o">
                            <div className="w-1/3" data-oid="wq98b6b">
                              <label
                                className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block"
                                data-oid="4o7jc_k"
                              >
                                Type
                              </label>
                              <Select
                                value={q.type}
                                onValueChange={(v) => updateQuestion(q.id, 'type', v)}
                                data-oid="vd4q:2v"
                              >
                                <SelectTrigger className="h-8 text-xs" data-oid="v-jdbza">
                                  <SelectValue data-oid="1io55:8" />
                                </SelectTrigger>
                                <SelectContent data-oid="3k1dmgw">
                                  {QUESTION_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value} data-oid="qlrw0hj">
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="2/3 flex-1" data-oid="0ctt8y7">
                              <label
                                className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block"
                                data-oid="6w1o.u:"
                              >
                                Question Text
                              </label>
                              <Input
                                value={q.question_text}
                                onChange={(e) =>
                                  updateQuestion(q.id, 'question_text', e.target.value)
                                }
                                className="h-8 text-sm"
                                data-oid="fd56ndj"
                              />
                            </div>
                          </div>

                          {/* Options (MCQ) */}
                          {(q.type === 'multiple_choice' || q.options?.length > 0) && (
                            <div className="space-y-3" data-oid="737328d">
                              {(q.mcq_title || q.type === 'multiple_choice') && (
                                <div data-oid="imu_-2u">
                                  <label
                                    className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block"
                                    data-oid="0v1gfex"
                                  >
                                    Title / Context
                                  </label>
                                  <Input
                                    value={q.mcq_title || ''}
                                    onChange={(e) =>
                                      updateQuestion(q.id, 'mcq_title', e.target.value)
                                    }
                                    className="h-8 text-xs font-medium"
                                    placeholder="Optional group title"
                                    data-oid="qqqqopp"
                                  />
                                </div>
                              )}
                              <div data-oid="bwz3jpk">
                                <label
                                  className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block"
                                  data-oid="6t3dskf"
                                >
                                  Options (One per line if parsing failed)
                                </label>
                                <Textarea
                                  value={
                                    Array.isArray(q.options) ? q.options.join('\n') : q.options
                                  }
                                  onChange={(e) =>
                                    updateQuestion(q.id, 'options', e.target.value.split('\n'))
                                  }
                                  className="min-h-[60px] text-xs font-mono p-2"
                                  placeholder="A. Option 1..."
                                  data-oid="nkc0t2s"
                                />
                              </div>
                            </div>
                          )}

                          {/* Complex Type Previews */}
                          {q.type === 'table_completion' && q.table_data && (
                            <div
                              className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                              data-oid="m5m2_t6"
                            >
                              <div className="font-semibold mb-1" data-oid="6y9vj4k">
                                Table Data Detected:
                              </div>
                              <ul
                                className="list-disc list-inside text-muted-foreground"
                                data-oid="6n31mnc"
                              >
                                <li data-oid="fk4f-t6">
                                  {q.table_data.table_headers?.length || 0} Columns
                                </li>
                                <li data-oid="1ns0bkq">
                                  {q.table_data.table_rows?.length || 0} Rows
                                </li>
                                <li data-oid="15q62lu">
                                  {q.table_data.blank_positions?.length || 0} Blanks (Answers:{' '}
                                  {q.table_data.blank_positions?.filter((b) => b.answer).length ||
                                    0}
                                  )
                                </li>
                              </ul>
                            </div>
                          )}

                          {q.type === 'flowchart' && q.flowchart && (
                            <div
                              className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 font-medium"
                              data-oid="flow-prev"
                            >
                              <div className="font-semibold mb-1">Flowchart Detected:</div>
                              <ul className="list-disc list-inside text-muted-foreground">
                                <li>{q.flowchart.steps?.length || 0} Steps</li>
                                <li>{q.flowchart.options?.length || 0} Options</li>
                              </ul>
                            </div>
                          )}

                          {q.type === 'matching_features' && q.matching_features && (
                            <div
                              className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                              data-oid="e871949"
                            >
                              <div className="font-semibold mb-1" data-oid="tcod1rg">
                                Matching Features Detected:
                              </div>
                              <ul
                                className="list-disc list-inside text-muted-foreground"
                                data-oid="5mt3uj5"
                              >
                                <li data-oid="3vmhpr8">Style: {q.matching_features.style}</li>
                                <li data-oid="3z.99t_">
                                  {q.matching_features.options?.length || 0} Options
                                </li>
                                <li data-oid="nkoyfvl">
                                  {q.matching_features.questions?.length || 0} Items to Match
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* Correct Answer Rendering */}
                          {(() => {
                            if (q.type === 'notes_completion' || q.type === 'note_completion') {
                              return (
                                <div
                                  className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3"
                                  data-oid="p2-xxc6"
                                >
                                  <div
                                    className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2"
                                    data-oid="49902pq"
                                  >
                                    Gap Answers
                                  </div>
                                  <div
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                    data-oid="uv52ld."
                                  >
                                    {(() => {
                                      const text = q.gap_fill?.structured_text || '';
                                      const gaps = Array.from(text.matchAll(/\[(\d+)\]/g)).map(
                                        (m) => parseInt(m[1])
                                      );
                                      const uniqueGaps = [...new Set(gaps)].sort((a, b) => a - b);
                                      return uniqueGaps.map((num) => (
                                        <div
                                          key={num}
                                          className="flex items-center gap-2"
                                          data-oid="lyxvc:d"
                                        >
                                          <Badge
                                            variant="outline"
                                            className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950"
                                            data-oid="f1_e_wl"
                                          >
                                            {num}
                                          </Badge>
                                          <Input
                                            value={q.gap_fill?.answers?.[num] || ''}
                                            onChange={(e) => {
                                              const newAnswers = { ...(q.gap_fill?.answers || {}) };
                                              newAnswers[num] = e.target.value;
                                              updateQuestion(q.id, 'gap_fill', {
                                                ...q.gap_fill,
                                                answers: newAnswers,
                                              });
                                            }}
                                            placeholder="Answer"
                                            className="h-7 text-xs bg-white/80 dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50"
                                            data-oid="dps9usb"
                                          />
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              );
                            }

                            if (q.type === 'matching_features' && q.matching_features) {
                              const mf = q.matching_features;
                              const isParagraph = mf.mode === 'paragraph';

                              return (
                                <div
                                  className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3"
                                  data-oid="blt5d17"
                                >
                                  <div
                                    className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2"
                                    data-oid="qu6iwi3"
                                  >
                                    {isParagraph ? 'Paragraph Answers' : 'Statement Answers'}
                                  </div>
                                  <div
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                    data-oid="nx1ypqo"
                                  >
                                    {isParagraph ? (
                                      <>
                                        {(() => {
                                          const text = mf.text || '';
                                          const gaps = Array.from(text.matchAll(/\[(\d+)\]/g)).map(
                                            (m) => parseInt(m[1])
                                          );
                                          const uniqueGaps = [...new Set(gaps)].sort(
                                            (a, b) => a - b
                                          );
                                          return uniqueGaps.map((num) => (
                                            <div
                                              key={num}
                                              className="flex items-center gap-2"
                                              data-oid="wsj327l"
                                            >
                                              <Badge
                                                variant="outline"
                                                className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950"
                                                data-oid="0ykotq8"
                                              >
                                                {num}
                                              </Badge>
                                              <Input
                                                value={mf.answers?.[num] || ''}
                                                onChange={(e) => {
                                                  const newAnswers = { ...(mf.answers || {}) };
                                                  newAnswers[num] = e.target.value;
                                                  updateQuestion(q.id, 'matching_features', {
                                                    ...mf,
                                                    answers: newAnswers,
                                                  });
                                                }}
                                                placeholder="e.g. A"
                                                className="h-7 text-xs bg-white/80 dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50 w-16"
                                                data-oid="7h1ucm0"
                                              />
                                            </div>
                                          ));
                                        })()}
                                      </>
                                    ) : (
                                      <>
                                        {(mf.questions || []).map((mq, idx) => {
                                          const qNum =
                                            mq.questionNumber ||
                                            mq.question_number ||
                                            (q.question_number || 1) + idx;
                                          return (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2"
                                              data-oid="gflxdd5"
                                            >
                                              <Badge
                                                variant="outline"
                                                className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950"
                                                data-oid="9vi08pr"
                                              >
                                                {qNum}
                                              </Badge>
                                              <Input
                                                value={mq.answer || ''}
                                                onChange={(e) => {
                                                  const newQuestions = [...(mf.questions || [])];
                                                  newQuestions[idx] = {
                                                    ...mq,
                                                    answer: e.target.value,
                                                  };
                                                  updateQuestion(q.id, 'matching_features', {
                                                    ...mf,
                                                    questions: newQuestions,
                                                  });
                                                }}
                                                placeholder="e.g. A"
                                                className="h-7 text-xs bg-white/80 dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50 w-16"
                                                data-oid="2nn:59n"
                                              />
                                            </div>
                                          );
                                        })}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            if (q.type === 'flowchart' && q.flowchart) {
                              const fc = q.flowchart;
                              let cumulativeIdx = 0;
                              return (
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3">
                                  <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                                    Flowchart Answers
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(fc.steps || []).map((step, sIdx) => {
                                      const stepGaps = step.gap_numbers || [];
                                      const startIdx = cumulativeIdx;
                                      cumulativeIdx += stepGaps.length;

                                      return stepGaps.map((num, gIdx) => {
                                        const globalGapIdx = startIdx + gIdx;
                                        return (
                                          <div
                                            key={`${sIdx}_${gIdx}`}
                                            className="flex items-center gap-2"
                                          >
                                            <Badge
                                              variant="outline"
                                              className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950"
                                            >
                                              {num}
                                            </Badge>
                                            <Input
                                              value={fc.answers?.[globalGapIdx] || ''}
                                              onChange={(e) => {
                                                const newAnswers = { ...(fc.answers || {}) };
                                                newAnswers[globalGapIdx] = e.target.value;
                                                updateQuestion(q.id, 'flowchart', {
                                                  ...fc,
                                                  answers: newAnswers,
                                                });
                                              }}
                                              placeholder="Answer"
                                              className="h-7 text-xs bg-white/80 dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50"
                                            />
                                          </div>
                                        );
                                      });
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            if (q.type === 'table_completion' && q.table_data) {
                              const td = q.table_data;
                              return (
                                <div
                                  className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3"
                                  data-oid="mkcta.x"
                                >
                                  <div
                                    className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2"
                                    data-oid="knmgz56"
                                  >
                                    Table Answers
                                  </div>
                                  <div
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                    data-oid="ghgbyga"
                                  >
                                    {(td.blank_positions || []).map((blank, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2"
                                        data-oid="95r.5z_"
                                      >
                                        <Badge
                                          variant="outline"
                                          className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] border-emerald-200 text-emerald-600 bg-white"
                                          data-oid="rntclq0"
                                        >
                                          {blank.blankNumber}
                                        </Badge>
                                        <Input
                                          value={blank.answer || ''}
                                          onChange={(e) => {
                                            const newBlanks = [...(td.blank_positions || [])];
                                            newBlanks[idx] = {
                                              ...blank,
                                              answer: e.target.value,
                                            };
                                            updateQuestion(q.id, 'table_data', {
                                              ...td,
                                              blank_positions: newBlanks,
                                            });
                                          }}
                                          placeholder="Answer"
                                          className="h-7 text-xs bg-white/80 border-emerald-100 dark:bg-slate-900"
                                          data-oid="c13hemh"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            // Default for other types
                            return (
                              <div data-oid=":mb5cw0">
                                <label
                                  className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block text-green-600 dark:text-green-500"
                                  data-oid="xsmpswe"
                                >
                                  Correct Answer
                                </label>
                                <Input
                                  value={
                                    Array.isArray(q.correct_answer)
                                      ? q.correct_answer.join(', ')
                                      : q.correct_answer
                                  }
                                  onChange={(e) =>
                                    updateQuestion(q.id, 'correct_answer', e.target.value)
                                  }
                                  className="h-8 text-sm border-green-200 dark:border-green-900 focus-visible:ring-green-500 bg-green-50/30 dark:bg-green-900/10"
                                  placeholder="e.g. TRUE"
                                  data-oid="l_hz4n4"
                                />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Actions */}
                        <div data-oid=".tm:dz4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => deleteQuestion(q.id)}
                            data-oid="x-jfrgc"
                          >
                            <Trash2 className="w-4 h-4" data-oid="ph.5tp5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50 dark:bg-slate-900/50" data-oid="q83i9q2">
          <Button variant="ghost" onClick={handleBack} data-oid="yrto0t1">
            {step === 1 || (mode === 'answers_only' && step === 2) ? 'Cancel' : 'Back'}
          </Button>

          {step === 1 && (
            <Button
              onClick={handleParseQuestions}
              disabled={!rawText.trim()}
              className="bg-violet-600 text-white hover:bg-violet-700"
              data-oid="9qkdmzh"
            >
              Parse Questions <ArrowRight className="w-4 h-4 ml-2" data-oid="gbjkgg6" />
            </Button>
          )}

          {step === 2 && (
            <div className="flex gap-2" data-oid="bjty1tz">
              <Button
                variant="outline"
                onClick={() => {
                  setAnswerText('');
                  handleParseAnswers();
                }}
                data-oid="syhu:7f"
              >
                Skip Answers
              </Button>
              <Button
                onClick={handleParseAnswers}
                className="bg-violet-600 text-white hover:bg-violet-700"
                data-oid="k5_ujki"
              >
                Process Answers <ArrowRight className="w-4 h-4 ml-2" data-oid="fhup_qx" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <Button
              onClick={handleFinalImport}
              disabled={parsedQuestions.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
              data-oid="bi4xai4"
            >
              <Check className="w-4 h-4 mr-2" data-oid="cp2r0dx" />
              Import {parsedQuestions.length} Questions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportModal;
