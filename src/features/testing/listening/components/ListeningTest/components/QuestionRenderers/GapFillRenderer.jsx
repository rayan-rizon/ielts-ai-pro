import GapFillContent from '../GapFillContent';

const GapFillRenderer = ({
  question,
  answers,
  handleAnswerChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
  isInsideMergedCard,
  cardClass,
}) => {
  // Computed display number for GapFill (usually just the start number)
  const displayStart = question._displayStartNumber || question.question_number || 1;

  return (
    <div key={question.id} id={`question-${question.id}`} className={cardClass} data-oid="5.bp053">
      <div className={isInsideMergedCard ? 'px-0' : 'p-2'} data-oid="40tq17b">
        {question.gap_fill?.box_title && (
          <div
            className={`bg-linear-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-white/5 dark:via-white/3 dark:to-white/5 py-2 px-3 ${isInsideMergedCard ? 'rounded-lg' : '-mx-2 -mt-2 rounded-t-xl'} mb-3 border-b border-slate-200/60 dark:border-white/[0.07]`}
            data-oid="yv67yft"
          >
            <h4
              className="font-bold text-center text-[15px] text-slate-700 dark:text-slate-300 tracking-wide uppercase"
              data-oid="mmtlkhn"
            >
              {question.gap_fill.box_title}
            </h4>
          </div>
        )}

        <div className="flex gap-4 items-start" data-oid="v5kd6ju">
          <div className="flex-1 pt-0" data-oid="wo1eig_">
            <GapFillContent
              question={question}
              answers={answers}
              handleAnswerChange={handleAnswerChange}
              isFinished={isFinished}
              correctAnswersMap={correctAnswersMap}
              questionNum={displayStart}
              toggleFlag={toggleFlag}
              flaggedQuestions={flaggedQuestions}
              data-oid="i9f:ex9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapFillRenderer;
