import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { toRoman } from '../../utils/helpers';

const MatchingFeaturesRenderer = ({
  question,
  answers,
  handleAnswerChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
}) => {
  // Get select trigger styling based on correctness
  const getSelectStyle = (qId) => {
    const baseStyle = 'w-[110px] h-8 text-sm transition-all font-medium shadow-sm';

    if (!isFinished) {
      return cn(
        baseStyle,
        'bg-white/70 dark:bg-slate-950/40 border border-slate-300/70 dark:border-slate-700/70 text-foreground',
        'focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50',
        'hover:border-slate-400/80 dark:hover:border-slate-600/80 shadow-sm'
      );
    }

    // Review mode - check correctness
    const validation = correctAnswersMap[qId];
    const value = answers[qId];

    if (validation?.isCorrect) {
      return cn(
        baseStyle,
        'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      );
    } else if (value) {
      return cn(
        baseStyle,
        'border-rose-500 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
      );
    } else {
      return cn(
        baseStyle,
        'bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-foreground'
      );
    }
  };

  return (
    <div key={question.id} id={`question-${question.id}`} className="mb-0" data-oid="f.48bvu">
      {/* Box for Options */}
      {question.matching_features?.options?.length > 0 && (
        <div
          className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 mb-3 shadow-xs"
          data-oid="xl5fcqg"
        >
          {question.matching_features.box_title && (
            <h3
              className="font-extrabold text-center text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-wider uppercase mb-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-2"
              data-oid=".2mc:94"
            >
              {question.matching_features.box_title}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1" data-oid="cbcg6-x">
            {question.matching_features.options.map((opt, idx) => {
              // Handle style (ABC vs Roman)
              let label = String.fromCharCode(65 + idx);
              if (question.matching_features.style === 'ROMAN') {
                label = toRoman(idx + 1).toLowerCase();
              }
              return (
                <div key={idx} className="flex gap-3 items-baseline py-0.5" data-oid="4qq1hg2">
                  <span
                    className="font-extrabold text-blue-600 dark:text-blue-400 min-w-[1.2rem] text-right text-sm"
                    data-oid="m59z936"
                  >
                    {label}
                  </span>
                  <span
                    className="text-slate-700 dark:text-slate-300 text-[14.5px] font-medium leading-relaxed"
                    data-oid="rl5l9:-"
                  >
                    {opt.replace(/^[A-Z]\s*[.)]\s*/i, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div
        className="flex flex-col rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xs"
        data-oid="1s2u7h4"
      >
        {question.matching_features?.questions_title && (
          <div
            className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800"
            data-oid="1gzj0yw-container"
          >
            <h3
              className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight"
              data-oid="1gzj0yw"
            >
              {question.matching_features.questions_title}
            </h3>
          </div>
        )}
        {question.matching_features?.questions?.map((q, idx) => {
          // Internal Question ID
          const qId = q.id || `${question.id}_${idx}`;
          const options = question.matching_features.options || [];

          // Compute status for the circle
          let circleStatus = 'default';
          const validation = correctAnswersMap[qId];
          const hasAnswer = !!answers[qId];
          if (isFinished) {
            circleStatus =
              validation?.isCorrect === true ? 'correct' : hasAnswer ? 'incorrect' : 'unanswered';
          }

          return (
            <div
              key={idx}
              id={`question-${qId}`}
              className="flex items-center gap-2 py-3 px-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              data-oid="zf-hu:v"
            >
              <div className="flex items-center gap-3" data-oid="v:n30a4">
                <QuestionNumberCircle
                  number={
                    q.questionNumber ||
                    (question._displayStartNumber || question.question_number) + idx
                  }
                  isFlagged={flaggedQuestions.has(qId)}
                  onClick={() => toggleFlag(qId)}
                  status={circleStatus}
                  className="shrink-0"
                  data-oid="lscf.b:"
                />

                <div
                  className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 leading-normal"
                  data-oid="6w2kexr"
                >
                  {q.text}
                </div>
              </div>

              <Select
                value={answers[qId] || ''}
                onValueChange={(val) => handleAnswerChange(qId, val)}
                disabled={isFinished}
                data-oid="ujf764i"
              >
                <SelectTrigger className={getSelectStyle(qId)} data-oid="c8f2:yh">
                  <SelectValue placeholder="Select" data-oid="r9_4lg:" />
                </SelectTrigger>
                <SelectContent data-oid="3fb27j8">
                  {options.map((opt, oIdx) => {
                    let label = String.fromCharCode(65 + oIdx);
                    if (question.matching_features.style === 'ROMAN')
                      label = toRoman(oIdx + 1).toLowerCase();
                    return (
                      <SelectItem
                        key={oIdx}
                        value={label}
                        className="text-sm justify-center"
                        data-oid="0zqnpjb"
                      >
                        <span
                          className="font-semibold text-blue-600 dark:text-blue-400"
                          data-oid="htxpg2z"
                        >
                          {label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingFeaturesRenderer;
