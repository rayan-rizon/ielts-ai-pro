import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WELL, TILE, MUTED } from '@/features/dashboard/components/primitives';
export default function LessonQuestion({ item, response, busy, onAnswer }) {
  const [answer, setAnswer] = useState(item.kind === 'order' ? [] : '');
  const [evidence, setEvidence] = useState('');
  const [hint, setHint] = useState(false);
  const submitted = Boolean(response);
  const options = item.options || [];
  if (item.audio?.startsWith('/audio/skill-lab/')) {
    return (
      <div className={`${WELL} rounded-lg p-4 text-sm space-y-2`}>
        <p>This older audio lesson has been retired. Your previous results are still saved.</p>
        <Link className="underline text-[#5a63df]" to="/practice-lab">
          Practise with original library audio
        </Link>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer({ item_id: item.id, answer, evidence });
      }}
    >
      {item.passage && (
        <blockquote className={`${WELL} p-4 text-sm leading-relaxed`}>{item.passage}</blockquote>
      )}
      {item.audio && (
        <div className="space-y-2">
          <audio controls preload="none" src={item.audio} className="w-full">
            Your browser does not support audio playback.
          </audio>
          <p className={`text-xs ${MUTED}`}>
            Listen first. The written version appears after you answer.
          </p>
        </div>
      )}
      <fieldset disabled={submitted || busy} className="space-y-3">
        <legend className="mb-3 font-semibold">{item.prompt}</legend>
        {item.kind === 'short' ? (
          <input
            aria-label="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={100}
            className={`${TILE} w-full p-3`}
            required
          />
        ) : item.kind === 'order' ? (
          <div className="space-y-2">
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() =>
                  setAnswer(
                    answer.includes(option)
                      ? answer.filter((v) => v !== option)
                      : [...answer, option]
                  )
                }
                className={`${TILE} block w-full p-3 text-left text-sm`}
              >
                <span className="mr-2 font-mono">
                  {answer.includes(option) ? answer.indexOf(option) + 1 : '—'}
                </span>
                {option}
              </button>
            ))}
            <p className={`text-xs ${MUTED}`}>
              Select sentences in order. Select a sentence again to remove it.
            </p>
          </div>
        ) : (
          options.map((option) => (
            <label
              key={option}
              className={`${TILE} flex cursor-pointer items-start gap-3 p-3 text-sm`}
            >
              <input
                type="radio"
                name={item.id}
                value={option}
                checked={answer === option}
                onChange={() => setAnswer(option)}
                className="mt-0.5"
                required
              />
              {option}
            </label>
          ))
        )}
        {item.evidence && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">What supports your answer?</p>
            {item.evidence.map((option) => (
              <label key={option} className={`${TILE} flex items-start gap-3 p-3 text-sm`}>
                <input
                  type="radio"
                  name="evidence"
                  checked={evidence === option}
                  onChange={() => setEvidence(option)}
                  required
                />
                {option}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {!submitted && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={
              busy || !answer.length || (item.kind === 'order' && answer.length !== options.length)
            }
          >
            {busy ? 'Saving…' : 'Check my answer'}
          </Button>
          {item.hint && (
            <Button type="button" variant="outline" onClick={() => setHint(true)}>
              Show a hint
            </Button>
          )}
        </div>
      )}
      {hint && !submitted && <p className={`${WELL} p-3 text-sm`}>{item.hint}</p>}
      {submitted && (
        <div role="status" className={`${WELL} space-y-2 p-4`}>
          <p className="font-semibold">
            {response.correct ? 'That’s right' : 'Let’s look at this together'}
          </p>
          <p className="text-sm">{item.explanation}</p>
          {item.transcript && (
            <p className="text-sm">
              <strong>What you heard: </strong>
              {item.transcript}
            </p>
          )}
          <p className={`text-xs ${MUTED}`}>
            Your first answer is saved. You’ll get a different example to try later.
          </p>
        </div>
      )}
    </form>
  );
}
