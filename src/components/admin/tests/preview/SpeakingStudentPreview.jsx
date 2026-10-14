import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PANEL, TITLE } from '@/features/dashboard/components/primitives.jsx';
import TestHeader from '@/features/testing/speaking/components/TestHeader';
import Part2CueCard from '@/features/testing/speaking/components/Part2CueCard';
import ConversationMessage from '@/features/testing/speaking/components/ConversationMessage';
import TestPreviewShell from './TestPreviewShell';
export default function SpeakingStudentPreview({ parts, title, onClose }) {
  const [active, setActive] = useState(0),
    [questionIndex, setQuestionIndex] = useState(0),
    [responses, setResponses] = useState({}),
    [muted, setMuted] = useState(true);
  const part = parts[active] || {};
  const lines = String(part.prompt || part.content || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const current = lines[questionIndex] || 'No question provided for this part.';
  const key = `${active}_${questionIndex}`;
  return (
    <TestPreviewShell
      moduleName="Speaking"
      title={title}
      onClose={onClose}
      onReset={() => {
        setResponses({});
        setQuestionIndex(0);
        setActive(0);
      }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <TestHeader
          currentPartNumber={active + 1}
          currentPart={{ ...part, questions: lines.join('\n') }}
          totalParts={parts.length}
          currentQuestionIndex={questionIndex}
          timeLeft={(part.duration_minutes || 5) * 60}
          testTitle={title}
          isMuted={muted}
          setIsMuted={setMuted}
          isPart2Prep={active === 1}
          isPartComplete={false}
          onShowExitDialog={onClose}
          speakingMode="practice"
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {parts.map((value, index) => (
            <Button
              key={index}
              size="sm"
              variant={active === index ? 'default' : 'outline'}
              onClick={() => {
                setActive(index);
                setQuestionIndex(0);
              }}
            >
              Part {index + 1}
            </Button>
          ))}
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs text-slate-500">
            Preview the prompt sequence. Microphone, examiner AI and submissions are disabled.
          </p>
          {active === 1 ? (
            <Part2CueCard cueCardTopic={{ bulletPoints: lines }} />
          ) : (
            <ConversationMessage
              entry={{ speaker: 'ai', text: current }}
              index={0}
              speakingMode="practice"
            />
          )}
          <section className={`${PANEL} p-4 space-y-3`}>
            <h3 className={TITLE}>Candidate response</h3>
            <Textarea
              aria-label="Preview speaking response"
              value={responses[key] || ''}
              placeholder="Type a sample response to inspect the conversation layout…"
              onChange={(e) => setResponses((previous) => ({ ...previous, [key]: e.target.value }))}
              className="shadow-none"
            />
            {responses[key] && (
              <ConversationMessage
                entry={{ speaker: 'user', text: responses[key] }}
                index={1}
                speakingMode="practice"
                authUser={{ full_name: 'Preview candidate' }}
              />
            )}
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={!questionIndex}
                onClick={() => setQuestionIndex(questionIndex - 1)}
              >
                Previous question
              </Button>
              <Button
                size="sm"
                disabled={active === 1 || questionIndex >= lines.length - 1}
                onClick={() => setQuestionIndex(questionIndex + 1)}
              >
                Next question
              </Button>
            </div>
          </section>
        </div>
      </div>
    </TestPreviewShell>
  );
}
