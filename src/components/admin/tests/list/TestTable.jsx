import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowDownCircle,
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Edit,
  FileText,
  GraduationCap,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { getQuestionCount, formatTestTitle, cn } from '@/lib/utils';
import { NUM, MICRO } from '../../ui/primitives';

const TIER_PILL = {
  premium:
    'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/[0.06]',
  pro: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
  free: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/[0.04]',
};

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
  const calculateTotalQuestions = (testId) =>
    questions
      .filter((q) => q.passage_id === testId)
      .reduce((acc, q) => acc + getQuestionCount(q), 0);

  const hasExplanations = (testId) => {
    const testQuestions = questions.filter((q) => q.passage_id === testId);
    if (testQuestions.length === 0) return false;
    return testQuestions.some((q) => {
      if (!q?.explanation_data) return false;
      if (typeof q.explanation_data === 'object') {
        const keys = Object.keys(q.explanation_data);
        if (keys.length === 0) return false;
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

  const getAnswerCount = (testId) => {
    const testQuestions = questions.filter((q) => q.passage_id === testId);
    if (testQuestions.length === 0) return 0;

    let totalCount = 0;
    testQuestions.forEach((q) => {
      let qCount = 0;
      const countArrayAnswers = (items, key = 'answer') => {
        if (!items || !Array.isArray(items)) return 0;
        return items.filter((item) => item && item[key] && String(item[key]).trim()).length;
      };
      const countObjectAnswers = (answers) => {
        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 0;
        return Object.values(answers).filter((a) => a && String(a).trim()).length;
      };

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

      if (qCount === 0 && q.map_labeling) {
        const mapItems = q.map_labeling.questions || q.map_labeling.items;
        qCount += countArrayAnswers(
          mapItems,
          mapItems === q.map_labeling.questions ? 'correct_answer' : 'answer'
        );
      }

      if (qCount === 0 && q.matching_data) {
        if (q.matching_data.questions && Array.isArray(q.matching_data.questions)) {
          qCount += countArrayAnswers(q.matching_data.questions, 'correct_answer');
        } else if (q.matching_data.answers && typeof q.matching_data.answers === 'object') {
          qCount += countObjectAnswers(q.matching_data.answers);
        } else if (q.matching_data.items) {
          qCount += countArrayAnswers(q.matching_data.items);
        }
      }

      if (qCount === 0) {
        if (q.correct_answers) qCount += countObjectAnswers(q.correct_answers);
        if (qCount === 0 && q.correct_answer) {
          if (Array.isArray(q.correct_answer)) {
            qCount += q.correct_answer.filter((a) => a && String(a).trim()).length;
          } else if (typeof q.correct_answer === 'string' && q.correct_answer.trim()) {
            const isMultiType =
              q.type === 'multiple_choice' ||
              q.type === 'matching_sentence_endings' ||
              q.type === 'matching_features';
            const isRange = q.question_number && String(q.question_number).includes('-');
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

  const toggleAll = () =>
    onSelectionChange(selectedIds.length === tests.length ? [] : tests.map((t) => t.id));
  const toggleOne = (id) =>
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );

  const SortHeader = ({ column, label, className }) => (
    <th
      onClick={() => onSort(column)}
      className={cn(
        MICRO,
        'px-3 py-2.5 cursor-pointer select-none transition-colors group',
        sortConfig?.key === column
          ? 'text-stone-900 dark:text-stone-50'
          : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            'w-2.5 h-2.5',
            sortConfig?.key === column ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          )}
        />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200 dark:border-white/[0.07]">
            <th className="w-10 px-4 py-2.5">
              <Checkbox
                checked={tests.length > 0 && selectedIds.length === tests.length}
                onCheckedChange={toggleAll}
              />
            </th>
            <SortHeader column="title" label="Test" className="w-[360px]" />
            <SortHeader column="is_active" label="Status" className="text-center" />
            <SortHeader column="access_tier" label="Tier" className="text-center" />
            <th className={cn(MICRO, 'px-3 py-2.5 text-stone-400 text-center')}>Content</th>
            <th className={cn(MICRO, 'px-3 py-2.5 text-stone-400 text-right pr-4')}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.length > 0 ? (
            tests.map((test) => {
              const answerCount = getAnswerCount(test.id);
              const totalQuestions = calculateTotalQuestions(test.id);
              const testHasExplanations = hasExplanations(test.id);

              return (
                <tr
                  key={test.id}
                  className={cn(
                    'group border-b border-stone-100 dark:border-white/[0.05] hover:bg-stone-50/70 dark:hover:bg-white/[0.02] transition-colors last:border-0',
                    selectedIds.includes(test.id) && 'bg-stone-50 dark:bg-white/[0.02]'
                  )}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(test.id)}
                      onCheckedChange={() => toggleOne(test.id)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-md grid place-items-center shrink-0',
                          test.is_active
                            ? 'bg-[rgb(var(--signal-ok)/0.08)] text-[rgb(var(--signal-ok))]'
                            : 'bg-[rgb(var(--signal-warn)/0.08)] text-[rgb(var(--signal-warn))]'
                        )}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEdit(test)}
                            className="text-[11px] font-extrabold text-stone-900 dark:text-stone-50 hover:underline underline-offset-2 truncate text-left"
                          >
                            {formatTestTitle(test)}
                          </button>
                          {test.is_official_cambridge && (
                            <span
                              className={cn(
                                MICRO,
                                'inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 border text-indigo-600 dark:text-indigo-400 border-indigo-300/50 dark:border-indigo-800/60 bg-indigo-500/[0.06]'
                              )}
                            >
                              <GraduationCap className="w-2.5 h-2.5" />
                              Cambridge
                            </span>
                          )}
                        </div>
                        <p className={cn(NUM, 'text-[10px] text-stone-400 mt-0.5')}>
                          {test.id.substring(0, 8)} ·{' '}
                          {new Date(test.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-1.5 py-0.5',
                        MICRO,
                        test.is_active
                          ? 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]'
                          : 'text-stone-400 border-stone-200 dark:border-white/10'
                      )}
                    >
                      {test.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-1.5 py-0.5 capitalize',
                        MICRO,
                        TIER_PILL[test.access_tier] || TIER_PILL.free
                      )}
                    >
                      {test.access_tier || 'free'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          NUM,
                          'text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1'
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3 text-[rgb(var(--signal-ok))]" />
                        {totalQuestions}Q
                      </span>
                      {answerCount > 0 ? (
                        <span className={cn(MICRO, 'text-[rgb(var(--signal-ok))]')}>
                          {answerCount} answered
                        </span>
                      ) : (
                        <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
                          no answers
                        </span>
                      )}
                      {testHasExplanations && (
                        <span
                          className={cn(
                            MICRO,
                            'inline-flex items-center gap-1 text-indigo-500 mt-0.5'
                          )}
                        >
                          <Sparkles className="w-2.5 h-2.5" /> explained
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[
                        { icon: Edit, title: 'Edit', onClick: () => onEdit(test), tone: 'default' },
                        {
                          icon: Copy,
                          title: 'Duplicate',
                          onClick: () => onDuplicate(test.id),
                          tone: 'default',
                        },
                        {
                          icon: ArrowDownCircle,
                          title: 'Export JSON',
                          onClick: () => onExport?.(test.id),
                          tone: 'default',
                        },
                        {
                          icon: Trash2,
                          title: 'Delete',
                          onClick: () => onDelete(test),
                          tone: 'fault',
                        },
                      ].map(({ icon: Icon, title, onClick, tone }) => (
                        <button
                          key={title}
                          onClick={onClick}
                          title={title}
                          className={cn(
                            'h-7 w-7 grid place-items-center rounded-md transition-colors',
                            tone === 'fault'
                              ? 'text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)]'
                              : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="py-20 text-center">
                <FileText className="w-8 h-8 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
                  No tests found
                </p>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Adjust your filters or create a new test to get started.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TestTable;
