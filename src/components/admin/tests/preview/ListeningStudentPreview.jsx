import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PANEL, TITLE } from '@/features/dashboard/components/primitives.jsx';
import QuestionGroupCard from '@/features/testing/listening/components/ListeningTest/components/QuestionGroupCard';
import AudioPlayer from '@/features/testing/listening/components/ListeningTest/components/AudioPlayer';
import SyncedTranscript from '@/features/testing/listening/components/ListeningTest/components/SyncedTranscript';
import ListeningPartTabs from '@/features/testing/listening/components/ListeningTest/components/ListeningPartTabs';
import { calculateListeningStats } from '@/features/testing/listening/components/ListeningTest/utils/listeningStats';
import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';
import { ExplanationBody } from '@/features/testing/reading/components/DeepDivePopover';
import TestPreviewShell from './TestPreviewShell';
import { buildListeningPreview } from './listeningPreviewData';
export default function ListeningStudentPreview({
  sections,
  title,
  onClose,
  showSourceHighlights = false,
}) {
  const { displaySections, questions } = useMemo(() => buildListeningPreview(sections), [sections]);
  const [activePart, setActivePart] = useState(0),
    [answers, setAnswers] = useState({}),
    [flagged, setFlagged] = useState(new Set()),
    [result, setResult] = useState(null),
    [currentTime, setCurrentTime] = useState(0),
    [showEvidence, setShowEvidence] = useState(showSourceHighlights);
  const audioRef = useRef(null);
  const current = displaySections[activePart] || {};
  const currentQuestions = questions.filter((q) => q.section === activePart + 1);
  const groups = currentQuestions.reduce((all, q) => {
    const last = all.at(-1);
    if (last && last.instructions === q.group_instructions && !q.mcq_title) last.questions.push(q);
    else all.push({ instructions: q.group_instructions, mcq_title: q.mcq_title, questions: [q] });
    return all;
  }, []);
  const changeAnswer = (id, value) => setAnswers((previous) => ({ ...previous, [id]: value }));
  const changeMultiple = (id, value, checked, limit = 40) => {
    if (Array.isArray(value)) return changeAnswer(id, value);
    setAnswers((previous) => {
      const next = new Set(previous[id] || []);
      if (checked === false || (checked == null && next.has(value))) next.delete(value);
      else if (next.size < limit) next.add(value);
      return { ...previous, [id]: [...next] };
    });
  };
  const toggleFlag = (id) =>
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const reset = () => {
    setAnswers({});
    setFlagged(new Set());
    setResult(null);
  };
  const stats = calculateListeningStats(
    displaySections,
    questions,
    answers,
    result?.answersMap || {},
    !!result
  );
  return (
    <TestPreviewShell moduleName="Listening" title={title} onClose={onClose} onReset={reset}>
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07]">
        <h2 className={TITLE}>
          IELTS Listening · <span className="font-mono">30:00</span>
        </h2>
        <Button
          size="sm"
          onClick={() =>
            setResult(calculateListeningTestResults(questions, answers, displaySections, flagged))
          }
        >
          Finish preview
        </Button>
      </div>
      {result && (
        <p role="status" className="text-xs px-4 py-2">
          Preview result: {result.correctAnswers}/{result.totalQuestions} correct
        </p>
      )}
      <ListeningPartTabs
        displaySections={displaySections}
        activePart={activePart}
        stats={stats}
        dispatch={(action) => {
          setActivePart(action.payload);
          setCurrentTime(0);
        }}
        ACTIONS={{ SET_ACTIVE_PART: 'preview-part' }}
      />
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 overflow-y-auto md:overflow-hidden">
        <section className="min-h-72 md:min-h-0 flex flex-col border-r border-[#e4e2f0] dark:border-white/[0.07] p-3 gap-3 overflow-y-auto">
          <div>
            {current.audio_url ? (
              <AudioPlayer
                key={activePart}
                ref={audioRef}
                src={current.audio_url}
                onTimeUpdate={setCurrentTime}
                onDurationChange={() => {}}
              />
            ) : (
              <p className="text-xs p-3 border rounded-lg">
                No audio for this part. Add audio in the editor.
              </p>
            )}
          </div>
          <div className={`${PANEL} flex-1 min-h-0 overflow-y-auto`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#e4e2f0] dark:border-white/[0.07]">
              <h3 className={TITLE}>Audioscript</h3>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={showEvidence}
                onClick={() => setShowEvidence(!showEvidence)}
              >
                Answer evidence
              </Button>
            </div>
            <SyncedTranscript
              srtContent={current.srt_content}
              plainTranscript={current.transcript}
              currentTime={currentTime}
              sourceHighlights={current.transcript_highlights}
              correctAnswersMap={result?.answersMap || {}}
              showAnswerHighlights={showEvidence}
              onSegmentClick={(time) => audioRef.current?.seek?.(time)}
            />
          </div>
        </section>
        <section className="p-3 min-h-0 md:overflow-y-auto">
          {groups.map((group, index) => (
            <QuestionGroupCard
              key={`${activePart}_${index}`}
              group={group}
              answers={answers}
              handleAnswerChange={changeAnswer}
              handleMultiSelectChange={changeMultiple}
              toggleFlag={toggleFlag}
              flaggedQuestions={flagged}
              isFinished={!!result}
              correctAnswersMap={result?.answersMap || {}}
            />
          ))}
          {result && (
            <ExplanationBody
              entries={currentQuestions.flatMap((q) =>
                q.explanation_data?.blanks
                  ? Object.entries(q.explanation_data.blanks).map(([key, data]) => ({ key, data }))
                  : q.explanation_data
                    ? [{ key: q._displayStartNumber, data: q.explanation_data }]
                    : []
              )}
            />
          )}
        </section>
      </div>
    </TestPreviewShell>
  );
}
