import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  Users as UsersIcon,
  ChevronRight,
  Copy,
  ArrowUpDown,
  GraduationCap,
  ArrowDownCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getQuestionCount, formatTestTitle, cn } from '@/lib/utils';

const TestTable = ({
  tests,
  questions,
  onEdit,
  onDelete,
  onDuplicate,
  selectedIds,
  onSelectionChange,
  onSort,
  sortConfig,
  onExport,
}) => {
  const calculateTotalQuestions = (testId) => {
    return questions
      .filter((q) => q.passage_id === testId)
      .reduce((acc, q) => acc + getQuestionCount(q), 0);
  };

  const hasExplanations = (testId) => {
    const testQuestions = questions.filter((q) => q.passage_id === testId);
    if (testQuestions.length === 0) return false;

    return testQuestions.some((q) => {
      if (!q?.explanation_data) return false;
      if (typeof q.explanation_data === 'object') {
        const keys = Object.keys(q.explanation_data);
        if (keys.length === 0) return false;
        // Additional check for empty blanks object common in our data
        if (
          keys.length === 1 &&
          keys[0] === 'blanks' &&
          Object.keys(q.explanation_data.blanks).length === 0
        ) {
          return false;
        }
        return true;
      }
      return false;
    });
  };

  // Count how many answers are configured for a test
  const getAnswerCount = (testId) => {
    const testQuestions = questions.filter((q) => q.passage_id === testId);
    if (testQuestions.length === 0) return 0;

    let totalCount = 0;
    testQuestions.forEach((q) => {
      let qCount = 0;

      // Helper for array items
      const countArrayAnswers = (items, key = 'answer') => {
        if (!items || !Array.isArray(items)) return 0;
        return items.filter((item) => item && item[key] && String(item[key]).trim()).length;
      };

      // Helper for object answers
      const countObjectAnswers = (answers) => {
        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 0;
        return Object.values(answers).filter((a) => a && String(a).trim()).length;
      };

      // 1. Priority: Complex Types (Gap Fill, Table, Flowchart, Map, Matching)
      // If any of these yield a count > 0, we use it.
      // If they are present but empty (e.g. valid structure but no answers yet, or malformed), we fall through to correct_answer.

      // Matching Features
      if (q.matching_features) {
        const mf = q.matching_features;
        const mode = mf.mode;

        if (mode === 'paragraph' && mf.answers && typeof mf.answers === 'object') {
          qCount += countObjectAnswers(mf.answers);
        } else if (mf.questions && Array.isArray(mf.questions) && mf.questions.length > 0) {
          qCount += countArrayAnswers(mf.questions);
        } else if (
          mf.answers &&
          typeof mf.answers === 'object' &&
          Object.keys(mf.answers).length > 0
        ) {
          qCount += countObjectAnswers(mf.answers);
        } else if (mf.items && Array.isArray(mf.items)) {
          qCount += countArrayAnswers(mf.items);
        }
      }

      // Gap Fill / Notes Completion
      // NOTE: Only if matching_features didn't already claim it (rare overlap)
      if (qCount === 0 && q.gap_fill) {
        if (
          q.gap_fill.answers &&
          typeof q.gap_fill.answers === 'object' &&
          !Array.isArray(q.gap_fill.answers)
        ) {
          qCount += countObjectAnswers(q.gap_fill.answers);
        } else if (q.gap_fill.items) {
          qCount += countArrayAnswers(q.gap_fill.items);
        }
      }

      // Table Completion
      if (qCount === 0 && q.table_data) {
        const tableBlanks =
          q.table_data.blanks || q.table_data.blank_positions || q.table_data.items;
        if (tableBlanks) {
          qCount += countArrayAnswers(tableBlanks);
        } else if (q.table_data.rows) {
          q.table_data.rows.forEach((row) => {
            if (row.cells) qCount += countArrayAnswers(row.cells);
          });
        }
      }

      // Flowchart
      if (qCount === 0 && q.flowchart) {
        if (
          q.flowchart.answers &&
          typeof q.flowchart.answers === 'object' &&
          !Array.isArray(q.flowchart.answers)
        ) {
          qCount += countObjectAnswers(q.flowchart.answers);
        } else if (q.flowchart.items) {
          qCount += countArrayAnswers(q.flowchart.items);
        }
      }

      // Map Labeling
      if (qCount === 0 && q.map_labeling) {
        const mapItems = q.map_labeling.questions || q.map_labeling.items;
        qCount += countArrayAnswers(
          mapItems,
          mapItems === q.map_labeling.questions ? 'correct_answer' : 'answer'
        );
      }

      // Matching Data
      if (qCount === 0 && q.matching_data) {
        if (q.matching_data.questions && Array.isArray(q.matching_data.questions)) {
          qCount += countArrayAnswers(q.matching_data.questions, 'correct_answer');
        } else if (q.matching_data.answers && typeof q.matching_data.answers === 'object') {
          qCount += countObjectAnswers(q.matching_data.answers);
        } else if (q.matching_data.items) {
          qCount += countArrayAnswers(q.matching_data.items);
        }
      }

      // 2. Fallback: Standard Correct Answer(s)
      // Only used if complex types yielded 0 (or weren't present)
      if (qCount === 0) {
        if (q.correct_answers) {
          qCount += countObjectAnswers(q.correct_answers);
        }

        // Still 0? Try correct_answer string
        if (qCount === 0 && q.correct_answer) {
          if (Array.isArray(q.correct_answer)) {
            qCount += q.correct_answer.filter((a) => a && String(a).trim()).length;
          } else if (typeof q.correct_answer === 'string' && q.correct_answer.trim()) {
            const isMultiType =
              q.type === 'multiple_choice' ||
              q.type === 'matching_sentence_endings' ||
              q.type === 'matching_features';

            const isRange = q.question_number && String(q.question_number).includes('-');

            // Only split by comma if it's explicitly a multi-selection question or a range
            // Otherwise, treat the entire string as a single answer (even if it contains commas/slashes)
            if ((isMultiType && q.allow_multiple) || isRange) {
              qCount += q.correct_answer.split(',').filter((a) => a.trim()).length;
            } else {
              qCount += 1;
            }
          }
        }
      }

      totalCount += qCount;
    });

    return totalCount;
  };

  const toggleAll = () => {
    if (selectedIds.length === tests.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tests.map((t) => t.id));
    }
  };

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortIcon = ({ column }) => {
    if (sortConfig?.key !== column)
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" data-oid="o_sgr-j" />;
    return (
      <ArrowUpDown
        className={`ml-2 h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-primary' : 'text-primary/70'}`}
        data-oid="_j-_zi_"
      />
    );
  };

  return (
    <div
      className="border text-card-foreground bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
      data-oid="q5qn2mv"
    >
      <div className="p-0" data-oid="c34-.7r">
        <div className="overflow-x-auto no-scrollbar" data-oid="g0ztq55">
          <Table className="min-w-[800px]" data-oid="6eox74_">
            <TableHeader
              className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/5"
              data-oid="5y40m9t"
            >
              <TableRow className="hover:bg-transparent" data-oid="8g6g231">
                <TableHead className="w-12 px-4" data-oid="e1u7y_x">
                  <Checkbox
                    checked={tests.length > 0 && selectedIds.length === tests.length}
                    onCheckedChange={toggleAll}
                    className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    data-oid="22eo_c_"
                  />
                </TableHead>
                <TableHead
                  className="w-[400px] px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  onClick={() => onSort('title')}
                  data-oid=".a9-1ze"
                >
                  <div className="flex items-center" data-oid="1zwdt3r">
                    Test Title <SortIcon column="title" data-oid="xvpx40g" />
                  </div>
                </TableHead>
                <TableHead
                  className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors text-center"
                  onClick={() => onSort('is_active')}
                  data-oid="u8w76na"
                >
                  <div className="flex items-center justify-center" data-oid="g:5mzmp">
                    Status <SortIcon column="is_active" data-oid="85tf5zp" />
                  </div>
                </TableHead>
                <TableHead
                  className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors text-center"
                  onClick={() => onSort('access_tier')}
                  data-oid="qqi5z4-"
                >
                  <div className="flex items-center justify-center" data-oid="8riarjy">
                    Tier <SortIcon column="access_tier" data-oid="m-jxc70" />
                  </div>
                </TableHead>
                <TableHead
                  className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center"
                  data-oid=".sy6bcv"
                >
                  Metadata
                </TableHead>
                <TableHead
                  className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right pr-6"
                  data-oid="dkp_e-t"
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="wfaru8r">
              {tests.length > 0 ? (
                tests.map((test) => (
                  <TableRow
                    key={test.id}
                    className={cn(
                      'group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-white/5 bg-transparent',
                      selectedIds.includes(test.id) && 'bg-indigo-50/50 dark:bg-indigo-950/30'
                    )}
                    data-oid="1ej9nun"
                  >
                    <TableCell className="px-4 py-2.5" data-oid=":o.6pw8">
                      <Checkbox
                        checked={selectedIds.includes(test.id)}
                        onCheckedChange={() => toggleOne(test.id)}
                        className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        data-oid="xtfflw."
                      />
                    </TableCell>
                    <TableCell className="px-2 py-2.5" data-oid="zxo3j0k">
                      <div className="flex items-center gap-3" data-oid="1g9xxx2">
                        <div
                          className={cn(
                            'p-2 rounded-xl border shrink-0',
                            test.is_active
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/80 dark:border-amber-900'
                          )}
                          data-oid="5ae.om-"
                        >
                          <FileText className="w-4 h-4" data-oid="bp4u0gk" />
                        </div>
                        <div className="flex flex-col min-w-0" data-oid="acv-zv3">
                          <div className="flex items-center gap-1.5" data-oid="cx87:xq">
                            <button
                              onClick={() => onEdit(test)}
                              className="text-xs font-black text-slate-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 text-left cursor-pointer"
                              data-oid="i4ais83"
                            >
                              {formatTestTitle(test)}
                            </button>
                            {test.is_official_cambridge && (
                              <Badge
                                variant="outline"
                                className="h-4.5 px-1.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900 flex items-center gap-1 shrink-0"
                                data-oid="soi7iec"
                              >
                                <GraduationCap className="w-2.5 h-2.5" data-oid="h6p:ykn" />
                                Cambridge
                              </Badge>
                            )}
                          </div>
                          <span
                            className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5"
                            data-oid="jxswbbh"
                          >
                            ID: {test.id.substring(0, 8)}... • Created{' '}
                            {new Date(test.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-center" data-oid="qxrm2ja">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase border shadow-2xs',
                          test.is_active
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                        data-oid="k8a2lf-"
                      >
                        {test.is_active ? 'Active' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-center" data-oid="lskig6k">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border shadow-2xs',
                          test.access_tier === 'premium'
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/80 dark:border-purple-900'
                            : test.access_tier === 'pro'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/80 dark:border-blue-900'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                        data-oid=".0ab3b4"
                      >
                        {test.access_tier || 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-center" data-oid="ay4946w">
                      {(() => {
                        const answerCount = getAnswerCount(test.id);
                        const totalQuestions = calculateTotalQuestions(test.id);
                        const testHasExplanations = hasExplanations(test.id);
                        return (
                          <div className="flex flex-col items-center gap-0.5" data-oid="weztnp.">
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {totalQuestions} Qs
                            </span>
                            {answerCount > 0 ? (
                              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                {answerCount} Confirmed
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                No Answers
                              </span>
                            )}
                            {testHasExplanations && (
                              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900 px-1.5 py-0.5 rounded-md uppercase flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Explained
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-right pr-6" data-oid="r2naswm">
                      <div
                        className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-oid="skkwb63"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(test)}
                          className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400"
                          title="Edit"
                          data-oid="u..p6e-"
                        >
                          <Edit className="w-3.5 h-3.5" data-oid="7lq6vy5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDuplicate(test.id)}
                          className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
                          title="Duplicate"
                          data-oid="n2bg13v"
                        >
                          <Copy className="w-3.5 h-3.5" data-oid="zjd8nvg" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onExport && onExport(test.id)}
                          className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
                          title="Export JSON"
                          data-oid="3-b2vd6"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5" data-oid="wyct.5r" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(test)}
                          className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                          title="Delete"
                          data-oid=".h6:-yf"
                        >
                          <Trash2 className="w-3.5 h-3.5" data-oid="49586ex" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow data-oid="o9-:5uv">
                  <TableCell colSpan={6} className="py-24 text-center" data-oid="yq_4v8l">
                    <div
                      className="flex flex-col items-center max-w-[280px] mx-auto"
                      data-oid="qzka1fs"
                    >
                      <div
                        className="p-6 bg-primary/5 rounded-full border border-primary/10 shadow-inner relative"
                        data-oid="04bb.8i"
                      >
                        <FileText
                          className="w-12 h-12 text-primary opacity-20"
                          data-oid="frjkf__"
                        />
                        <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      </div>
                      <h3
                        className="font-black text-2xl text-foreground tracking-tight mt-8"
                        data-oid="wzq5qdh"
                      >
                        No tests found
                      </h3>
                      <p
                        className="text-muted-foreground font-medium mt-2 leading-relaxed"
                        data-oid="rq_ttku"
                      >
                        Adjust your filters or create a new test to get started with your content
                        library.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TestTable;
