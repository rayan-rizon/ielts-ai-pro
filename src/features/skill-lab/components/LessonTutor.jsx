import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PANEL, WELL, MUTED, MICRO } from '@/features/dashboard/components/primitives';
import { askTutor } from '../services/skillLabService';
import Recorder from './Recorder';
export default function LessonTutor({ session, onRefresh }) {
  const [text, setText] = useState('');
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState('');
  const request = useRef(null);
  const paid = session.tier !== 'free';
  const available =
    (session.position < 0 || session.item?.stage === 'guided') && !session.completed_at;
  async function send(kind, audio) {
    setBusy(true);
    setError('');
    const key = JSON.stringify([kind, text, audio]);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    try {
      const data = await askTutor({
        sessionId: session.id,
        kind,
        answer: text,
        audio,
        requestId: request.current.id,
      });
      setSubmitted(text);
      setReply(data);
      request.current = null;
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className={`${PANEL} space-y-3 p-4`}>
      <h2 className="font-semibold">A little help</h2>
      <p className={`text-xs ${MUTED}`}>
        Your tutor uses only your saved learning progress. It does not remember your chats.
      </p>
      {!paid ? (
        <p className="text-sm">
          The lesson examples and hints are included. Pro and Premium also include questions for the
          AI teacher and feedback on your own answers.
        </p>
      ) : !available ? (
        <p className="text-sm">
          Try the check on your own. AI help is available in the learning part of your next lesson.
        </p>
      ) : (
        <>
          <label className="block text-sm font-medium" htmlFor="tutor-answer">
            Ask about this lesson, or write a practice answer
          </label>
          <textarea
            id="tutor-answer"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              request.current = null;
            }}
            maxLength={1800}
            rows={5}
            className={`${WELL} w-full resize-y p-3 text-sm`}
            disabled={busy}
          />
          {session.lesson.open_prompt && (
            <p className={`text-xs ${MUTED}`}>{session.lesson.open_prompt}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !text.trim() || text.length > 600 || session.help_used >= 3}
              onClick={() => send('help')}
            >
              Ask a question ({3 - session.help_used} left)
            </Button>
            {session.lesson.open_prompt && (
              <Button
                type="button"
                disabled={busy || !text.trim() || session.feedback_used >= 6}
                onClick={() => send('evaluate')}
              >
                Get feedback ({6 - session.feedback_used} left)
              </Button>
            )}
          </div>
          {session.lesson.module === 'speaking' && (
            <Recorder
              disabled={busy || session.audio_used >= 3 || session.feedback_used >= 6}
              onRecording={(audio) => send('audio', audio)}
            />
          )}
        </>
      )}
      {busy && (
        <p role="status" className="text-sm">
          Your teacher is checking…
        </p>
      )}
      {error && (
        <div role="alert" className="space-y-2 text-sm text-red-600">
          <p>{error}</p>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              request.current = null;
              setError('');
              void onRefresh();
            }}
          >
            Refresh before a new request
          </Button>
        </div>
      )}
      {reply && (
        <div className={`${WELL} space-y-3 p-3 text-sm`}>
          <p className={MICRO}>Your feedback</p>
          <p>{reply.explanation}</p>
          {reply.suggested_version && (
            <>
              <p>
                <strong>Your version:</strong> {submitted}
              </p>
              <p>
                <strong>One possible revision:</strong> {reply.suggested_version}
              </p>
            </>
          )}
          <p>
            <strong>Try next:</strong> {reply.next_step}
          </p>
          {reply.transcript && (
            <details>
              <summary>Check the words we heard</summary>
              <p>{reply.transcript}</p>
              <p className={`mt-2 text-xs ${MUTED}`}>{reply.transcript_note}</p>
            </details>
          )}
          <p className={`text-xs ${MUTED}`}>
            This feedback helps you practise. It does not change your test score.
          </p>
        </div>
      )}
    </aside>
  );
}
