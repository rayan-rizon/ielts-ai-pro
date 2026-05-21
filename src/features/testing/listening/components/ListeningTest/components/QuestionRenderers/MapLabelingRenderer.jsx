import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProxiedImageUrl } from '@/lib/utils';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { cn } from '@/lib/cn';

const MapLabelingRenderer = ({
  question,
  answers,
  handleAnswerChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
}) => {
  // Handle different potential data keys based on question type
  const mapData =
    question.map_labeling || question.diagram_data || question.diagram_completion || {};
  const questions = mapData.questions || question.questions || [];
  const options = mapData.options || question.options || [];
  const startNum = question._displayStartNumber || question.question_number || 1;
  const rawImageUrl = mapData.image_url || mapData.imageUrl || mapData.image || question.image_url;

  // Normalize image URL
  const imageUrl = React.useMemo(() => {
    return getProxiedImageUrl(rawImageUrl);
  }, [rawImageUrl]);

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

  const handleImageError = (e) => {
    console.error('Map image failed to load:', imageUrl);
    e.target.style.display = 'none';
    const parent = e.target.parentElement;
    if (parent) {
      parent.classList.add(
        'bg-slate-100',
        'dark:bg-slate-800',
        'p-8',
        'rounded-xl',
        'border-2',
        'border-dashed',
        'border-slate-300',
        'dark:border-slate-700'
      );
      const errorMsg = document.createElement('div');
      errorMsg.className =
        'text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2';

      // Safe SVG creation
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.classList.add('w-8 h-8', 'opacity-50');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '3');
      rect.setAttribute('y', '3');
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '18');
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      svg.appendChild(rect);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '8.5');
      circle.setAttribute('cy', '8.5');
      circle.setAttribute('r', '1.5');
      svg.appendChild(circle);

      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '21 15 16 10 5 21');
      svg.appendChild(polyline);

      errorMsg.appendChild(svg);

      const p1 = document.createElement('p');
      p1.className = 'font-medium';
      p1.textContent = 'Map image could not be loaded';
      errorMsg.appendChild(p1);

      const p2 = document.createElement('p');
      p2.className = 'text-xs';
      p2.textContent = 'The resource may be temporarily unavailable';
      errorMsg.appendChild(p2);

      parent.appendChild(errorMsg);
    }
  };

  return (
    <div
      key={question.id}
      id={`question-${question.id}`}
      className="mb-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md p-4"
      data-oid="u3ei-ba"
    >
      {/* Map Image */}
      {imageUrl && (
        <div className="mb-6 flex justify-center min-h-[100px]" data-oid="q0-elqn">
          <img
            src={imageUrl}
            alt="Map/Diagram"
            className="max-w-full max-h-[500px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
            onError={handleImageError}
            data-oid="96bm3m."
          />
        </div>
      )}

      {/* Questions Grid */}
      <div className="space-y-1.5" data-oid="ymke4up">
        {questions.map((q, idx) => {
          const qNum = q.questionNumber || startNum + idx;
          const qId = `map_${question.id}_${qNum}`;

          // Determine circle status
          let circleStatus = 'default';
          const validation = correctAnswersMap[qId];
          const hasAnswer = !!answers[qId];
          if (isFinished) {
            circleStatus =
              validation?.isCorrect === true ? 'correct' : hasAnswer ? 'incorrect' : 'unanswered';
          }

          return (
            <div
              key={q.id || idx}
              id={`question-${qId}`}
              className="flex items-center gap-4 py-1 px-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all duration-200"
              data-oid="eff4q00"
            >
              {/* Question Number */}
              <QuestionNumberCircle
                number={qNum}
                isFlagged={flaggedQuestions.has(qId)}
                onClick={() => toggleFlag(qId)}
                status={circleStatus}
                className="shrink-0"
                data-oid="9q6.euq"
              />

              {/* Question Text */}
              <div
                className="text-base font-semibold text-slate-800 dark:text-slate-100"
                data-oid="_11s_3t"
              >
                {q.text}
              </div>

              {/* Answer Dropdown */}
              <Select
                value={answers[qId] || ''}
                onValueChange={(val) => handleAnswerChange(qId, val)}
                disabled={isFinished}
                data-oid="o79iv1o"
              >
                <SelectTrigger className={getSelectStyle(qId)} data-oid="ad1t_j2">
                  <SelectValue placeholder="Select" data-oid="pmapd:." />
                </SelectTrigger>
                <SelectContent data-oid="4tkbxg7">
                  {options.map((opt, oIdx) => (
                    <SelectItem
                      key={oIdx}
                      value={typeof opt === 'string' ? opt : String.fromCharCode(65 + oIdx)}
                      data-oid="fuortv4"
                    >
                      <span className="font-bold" data-oid="28g67.5">
                        {typeof opt === 'string' ? opt : String.fromCharCode(65 + oIdx)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapLabelingRenderer;
